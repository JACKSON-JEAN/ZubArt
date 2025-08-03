import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddUserInput } from "../graphql/input/add_user.input";
import * as bcrypt from "bcrypt"
import { Role } from "generated/prisma";
import { SigInInput } from "../graphql/input/signIn.input";
import { JwtService } from "@nestjs/jwt";
import {v4 as uuid} from "uuid"

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService
    ) {}

    async signUp(addUserInput: AddUserInput) {
        const {fullName, email, password} = addUserInput
        if(!fullName || !email || !password) {
            throw new BadRequestException("Please enter all the necessary fields")
        }

        const user = await this.prismaService.user.findUnique({ where: {email: addUserInput.email}})
        if(user){
            throw new ConflictException("User already exists")
        }

        try {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
            const hashedPassword = await bcrypt.hash(password, saltRounds)
            const newUser = await this.prismaService.user.create({
                data: {
                    fullName: addUserInput.fullName,
                    email: addUserInput.email,
                    phone: addUserInput.phone || null,
                    password: hashedPassword,
                    role: addUserInput.role || Role.CUSTOMER,
                    isActive: true
                }
            })
            const { password: _, ...result} = newUser
            return result
            
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when creating an account")
        }
    }

    async signIn(signInInput: SigInInput) {
        const {email, password} = signInInput
        if(!email || !password) {
            throw new BadRequestException("Please fill all the required fields!")
        }

        const user = await this.prismaService.user.findUnique({ where: {email}})
        
        if(!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException("Wrong credentials. Try again later!")
        }

        try {
            await this.prismaService.refreshToken.deleteMany({
                where: {userId: user.id}
            })

            const tokens = await this.generateTokens({
                id: user.id,
                email: user.email,
                role: user.role
            })

            return {
                ...tokens,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            }
            
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when signing in!")
        }
    }

    async generateTokens(user: {id: number, email: string, role: string}) {
        const accessToken = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role
        },
        {expiresIn: process.env.JWT_EXPIRY_DATE || '15m'}
    )
    const refreshTokenPlain = uuid()
    const hashedRefreshToken = await bcrypt.hash(refreshTokenPlain, 10)

    await this.storeRefreshToken(hashedRefreshToken, user.id)

    return {
        accessToken,
        refreshToken: refreshTokenPlain
    }
    }

    async storeRefreshToken(token: string, userId: number) {
        const expiryDate = new Date()
        const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "3", 10)
        expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

        try {
           return await this.prismaService.refreshToken.create({
            data: {
                token,
                userId,
                expiryDate
            }
           })
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when storing the refreshToken")
        }
    }

    async refreshTokens(refreshToken: string) {
        // Find the refresh token in the database
        const tokenRecord = await this.prismaService.refreshToken.findFirst({
            where: {token: refreshToken, expiryDate: {gte: new Date()}}
           }) 

           if(!tokenRecord || !(await bcrypt.compare(refreshToken, tokenRecord.token))) {
            throw new UnauthorizedException("Invalid or expired refresh token")
           }

        try {
           // Delete the used refresh token
           await this.prismaService.refreshToken.delete({
            where: {id: tokenRecord.id}
           })

           // Fetch the user associated with the refresh token
           const user = await this.prismaService.user.findUnique({
            where: {id: tokenRecord.userId}
           })

           if(!user) {
            throw new UnauthorizedException("User not found")
           }

           // Generate new tokens
           return await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role
           })

        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when refreshing tokens")
        }
    }

    async logout(refreshToken: string) {
        const tokenRecord = await this.prismaService.refreshToken.findFirst({
            where: { token: refreshToken}
        })

        if(!tokenRecord || !(await bcrypt.compare(refreshToken, tokenRecord.token))) {
            throw new NotFoundException("No token found")
        }

        try {
           await this.prismaService.refreshToken.delete({ where: {id: tokenRecord.id}})
           return {
            success: true,
            message: 'Logged out successfully.'
           }
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when logging out!")
        }
    }
}
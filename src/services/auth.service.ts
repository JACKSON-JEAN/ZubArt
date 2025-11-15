import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddUserInput } from "../graphql/input/add_user.input";
import * as bcrypt from "bcrypt";
import { Role } from "generated/prisma";
import { SigInInput } from "../graphql/input/signIn.input";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuid } from "uuid";

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService
    ) {}

    async signUp(addUserInput: AddUserInput) {
        const { fullName, email, password } = addUserInput;
        if (!fullName || !email || !password) {
            throw new BadRequestException("Please enter all required fields");
        }

        const existingUser = await this.prismaService.user.findUnique({ 
            where: { email } 
        });
        if (existingUser) {
            throw new ConflictException("User already exists");
        }

        try {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            const newUser = await this.prismaService.user.create({
                data: {
                    fullName,
                    email,
                    phone: addUserInput.phone || null,
                    password: hashedPassword,
                    role: addUserInput.role || Role.CUSTOMER,
                    isActive: true
                }
            });

            const { password: _, ...result } = newUser;
            return result;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Failed to create user");
        }
    }

    async signIn(signInInput: SigInInput) {
        const { email, password } = signInInput;
        if (!email || !password) {
            throw new BadRequestException("Email and password are required");
        }

        const user = await this.prismaService.user.findUnique({ 
            where: { email } 
        });
        
        if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException("Invalid credentials");
        }

        try {
            await this.prismaService.refreshToken.deleteMany({
                where: { userId: user.id }
            });

            const tokens = await this.generateTokens({
                id: user.id,
                name: user.fullName,
                email: user.email,
                role: user.role
            });

            return {
                ...tokens,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Login failed");
        }
    }

    async generateTokens(user: { id: number; name: string; email: string; role: string }) {
        const accessToken = this.jwtService.sign(
            {
                sub: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            { expiresIn: (process.env.JWT_EXPIRY_DATE ?? '15m') as any }
        );

        const refreshToken = uuid();

        await this.storeRefreshToken(refreshToken, user.id);

        return {
            accessToken,
            refreshToken
        };
    }

    async storeRefreshToken(token: string, userId: number) {
        const expiryDate = new Date();
        expiryDate.setDate(
            expiryDate.getDate() + 
            parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "3", 10)
        );

        try {
            return await this.prismaService.refreshToken.create({
                data: {
                    token,
                    userId,
                    expiryDate
                }
            });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Failed to store refresh token");
        }
    }

    async refreshTokens(refreshToken: string) {
        const tokenRecord = await this.prismaService.refreshToken.findFirst({
            where: { 
                token: refreshToken,
                expiryDate: { gte: new Date() }
            }
        });

        if (!tokenRecord) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        try {
            await this.prismaService.refreshToken.delete({
                where: { id: tokenRecord.id }
            });

            const user = await this.prismaService.user.findUnique({
                where: { id: tokenRecord.userId }
            });

            if (!user) {
                throw new UnauthorizedException("User not found");
            }

            return await this.generateTokens({
                id: user.id,
                name: user.fullName,
                email: user.email,
                role: user.role
            });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Failed to refresh tokens");
        }
    }

    async logout(refreshToken: string) {
        const tokenRecord = await this.prismaService.refreshToken.findFirst({
            where: { token: refreshToken }
        });

        if (!tokenRecord) {
            throw new NotFoundException("Refresh token not found");
        }

        try {
            await this.prismaService.refreshToken.delete({ 
                where: { id: tokenRecord.id } 
            });
            return { success: true };
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Logout failed");
        }
    }
}
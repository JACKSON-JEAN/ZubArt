import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { SearchUsersInput } from "../graphql/input/search_users.input";
import { UpdateUserInput } from "../graphql/input/update_user.input";

@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService) {}

    async getUsers(searchInput: SearchUsersInput) {
        const {keyword, role} = searchInput
        try {
            return await this.prismaService.user.findMany({
                where: {
                    AND: [
                        role? {role} : {},
                        keyword? {
                            OR: [
                                { fullName: {contains: keyword, mode: 'insensitive'}},
                                { email: {contains: keyword, mode: 'insensitive'}},
                                {phone: {contains: keyword, mode: 'insensitive'}}
                            ]
                        } : {}
                    ]
                },
                orderBy: {createdAt: 'desc'}
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching users")
        }
    }

    async getUserById(userId: number) {
        const user = await this.prismaService.user.findUnique({where: {id: userId}})
        if(!user){
            throw new NotFoundException(`User with ID: ${userId} not found`)
        }

        return user
    }

    async updateUser(userId: number, updateInput: UpdateUserInput) {
        const user = await this.prismaService.user.findUnique({where: {id: userId}})
        if(!user){
            throw new NotFoundException(`User with ID: ${userId} not found`)
        }

        try {
           const updatedUser = await this.prismaService.user.update({
            where: {id: userId},
            data: updateInput
           }) 

           const {password:_, ...result} = updatedUser
           return result

        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating user")
        }
        
    }

    async deleteUser(userId: number) {
        const user = await this.prismaService.user.findUnique({where: {id: userId}})
        if(!user){
            throw new NotFoundException(`User with ID: ${userId} not found`)
        }

        try {
            await this.prismaService.user.delete({where: {id: userId}})
            return "User deleted successfully"
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting a user")
        }
    }
}
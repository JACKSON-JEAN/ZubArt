import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserModel } from "../graphql/models/user.model";
import { UpdateUserInput } from "../graphql/input/update_user.input";
import { UsersService } from "../services/users.service";
import { SearchUsersInput } from "../graphql/input/search_users.input";

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private usersService: UsersService) {}

    @Query(() => [UserModel])
    async getUsers(@Args('searchInput') searchInput: SearchUsersInput) {
        return await this.usersService.getUsers(searchInput)
    }

    @Query(() => UserModel)
    async getUserById(@Args('userId') userId: number) {
        return await this.usersService.getUserById(userId)
    }

    @Mutation(() => UserModel)
    async updateUser(@Args('userId') userId: number, @Args('updateInput') updateInput: UpdateUserInput) {
        return await this.usersService.updateUser(userId, updateInput)
    }

    @Mutation(() => String)
    async deleteUser(@Args('userId') userId: number) {
        return await this.usersService.deleteUser(userId)
    }

}
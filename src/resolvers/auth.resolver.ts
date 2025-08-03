import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UserModel } from "../graphql/models/user.model";
import { AuthService } from "../services/auth.service";
import { AddUserInput } from "../graphql/input/add_user.input";
import { AuthResponse } from "../graphql/models/auth_response.model";
import { SigInInput } from "../graphql/input/signIn.input";
import { AuthRefreshResponse } from "../graphql/models/refresh_response.model";
import { LogoutResponse } from "../graphql/models/logout_response.model";

@Resolver(() => UserModel)
export class AuthResolver {
    constructor(private authService: AuthService) {}

    @Mutation(() => UserModel)
    async signUp(@Args("signUpData") signUpData: AddUserInput) {
        return await this.authService.signUp(signUpData)
    }

    @Mutation(() => AuthResponse)
    async signIn(@Args("signInData") signInData: SigInInput) {
        return await this.authService.signIn(signInData)
    }

    @Mutation(() => AuthRefreshResponse)
    async refreshTokens(@Args("refreshToken") refreshToken: string) {
        return await this.authService.refreshTokens(refreshToken)
    }

    @Mutation(() => LogoutResponse)
    async logout(@Args("refreshToken") refreshToken: string) {
        return await this.authService.logout(refreshToken)
    }
}
import { Args, Query, Resolver } from "@nestjs/graphql";
import { CartService } from "../services/cart.service";
import { Cart } from "src/graphql/models/cart.model";

@Resolver(()=> Cart)
export class CartResolver {
    constructor(private cartService: CartService) {}

    @Query(() => [Cart])
    async getCarts() {
        return await this.cartService.getCarts()
    }

    @Query(() => Cart, {nullable: true})
    async getClientCart(@Args("clientId") clientId: number){
        return await this.cartService.getClientCart(clientId)
    }
}
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CartItem } from "../graphql/models/cartItem.model";
import { CartItemService } from "../services/cartItem.service";
import { AddCartItemInput } from "../graphql/input/add_cartItem.input";

@Resolver(() => CartItem)
export class CartItemResolver {
    constructor(private cartItemService: CartItemService){}

    @Mutation(() => CartItem)
    async addCartItem(@Args("addItemInput") addItemInput: AddCartItemInput, @Args("clientId") clientId: number) {
        return await this.cartItemService.addCartItem(addItemInput, clientId)
    }

    @Mutation(() =>CartItem)
    async cartItemIncrement(@Args("itemId") itemId: number, @Args("clientId") clientId: number){
        return await this.cartItemService.cartItemIncrement(itemId, clientId)
    }

    @Mutation(() =>CartItem)
    async cartItemDecrement(@Args("itemId") itemId: number, @Args("clientId") clientId: number){
        return await this.cartItemService.cartItemDecrement(itemId, clientId)
    }

    @Mutation(() =>String)
    async deleteCartItem(@Args("itemId") itemId: number, @Args("clientId") clientId: number) {
        return await this.cartItemService.deleteCartItem(itemId, clientId)
    }

    @Query(() => [CartItem])
    async getCartItems(@Args("clientId") clientId: number){
        return await this.cartItemService.getCartItems(clientId)
    }
}
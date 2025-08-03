import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { WishListModel } from "../graphql/models/wishList.model";
import { WishListService } from "../services/wishList.service";
import { AddWishListInput } from "../graphql/input/add_wishList.input";
import { UpdateWishListInput } from "../graphql/input/update_wishList.input";

@Resolver(() => WishListModel)
export class WishListResolver{
    constructor(private wishListService: WishListService) {}

    @Mutation(() => WishListModel)
    async addWishList(@Args("addWishListInput") addWishListInput: AddWishListInput) {
        return await this.wishListService.addWishList(addWishListInput)
    }

    @Query(() => [WishListModel])
    async getWishList() {
        return await this.wishListService.getWishList()
    }

    @Query(() => WishListModel)
    async getWishListById(@Args("wishListId") wishListId: number) {
        return await this.wishListService.getWishListById(wishListId)
    }

    @Mutation(() => WishListModel)
    async updateWishList(@Args("wishListId") wishListId: number, @Args("updateWishlistInput") updateWishlistInput: UpdateWishListInput) {
        return await this.wishListService.updateWishList(wishListId, updateWishlistInput)
    }

    @Mutation(() => String)
    async deleteWishList(wishListId: number) {
        return await this.wishListService.deleteWishList(wishListId)
    }
}
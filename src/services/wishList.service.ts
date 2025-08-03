import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddWishListInput } from "../graphql/input/add_wishList.input";
import { UpdateWishListInput } from "../graphql/input/update_wishList.input";

@Injectable()
export class WishListService{
    constructor(private prismaService: PrismaService){}

    async addWishList(addWishListInput: AddWishListInput) {
        const {customerId, artworkId} = addWishListInput
        if(!customerId || !artworkId) {
            throw new BadRequestException("Please enter all the required fields")
        }

        try {
            const addedWishList = await this.prismaService.wishList.create({
                data: {
                    customerId: addWishListInput.customerId,
                    artworkId: addWishListInput.artworkId
                }
            })
            return addedWishList

        } catch (error) {
            throw new InternalServerErrorException("There was an error when adding a new wishList")
        }
    }

    async getWishList() {
        try {
            return await this.prismaService.wishList.findMany({
                include: {
                    customer: true,
                    artwork: true
                }
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching the wishList")
        }
    }

    async getWishListById(wishListId: number) {
        const wishList = await this.prismaService.wishList.findUnique({
            where: {id: wishListId},
            include: {
                customer: true,
                artwork: true
            }
        })

        if(!wishList) {
            throw new NotFoundException(`There was no wishList found with ID: ${wishListId}`)
        }

        return wishList
    }

    async updateWishList(wishListId: number, updateWishListInput: UpdateWishListInput) {
        const wishList = await this.prismaService.wishList.findUnique({
            where: {id: wishListId}
        })

        if(!wishList) {
            throw new NotFoundException(`There was no wishList found with ID: ${wishListId}`)
        }

        try {
            const updatedWishList = await this.prismaService.wishList.update({
                where: {id: wishListId},
                data: updateWishListInput
            })
            return updatedWishList

        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating the wishList")
        }
    }

    async deleteWishList(wishListId: number) {
        const wishList = await this.prismaService.wishList.findUnique({
            where: {id: wishListId}
        })

        if(!wishList) {
            throw new NotFoundException(`There was no wishList found with ID: ${wishListId}`)
        }

        try {
            await this.prismaService.wishList.delete({ where: {id: wishListId}})
            return "WishList deleted successfully"
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting a wishList")
        }
    }
}
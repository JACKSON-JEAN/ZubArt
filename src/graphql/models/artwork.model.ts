import { Field, Float, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Category } from "generated/prisma";
import { ArtisanModel } from "./artisan.model";
import { WishListModel } from "./wishList.model";
import { OrderItemModel } from "./orderItem.model";
import { ReviewsModel } from "./review.model";
import { ArtworkMediaModel } from "./artworkMedia.model";

registerEnumType(Category, {
    name: "Category"
})

@ObjectType()
export class ArtworkModel {
    @Field(()=> Int)
    id: number

    @Field(()=> String)
    title: string

    @Field(()=> String)
    description: string

    @Field(()=> [ArtworkMediaModel])
    media: ArtworkMediaModel[]

    @Field(()=> Int, {nullable: true})
    yearCreated?: number

    @Field(()=> Category)
    category: Category

    @Field(()=> Float, {nullable: true})
    widthCm?: number

    @Field(()=> Float, {nullable: true})
    heightCm?: number

    @Field(()=> Float, {nullable: true})
    weightKg?: number

    @Field(()=> Boolean, {defaultValue: true})
    isUnique: boolean

    @Field(()=> Boolean, {defaultValue: true})
    isAvailable: boolean

    @Field(()=> Boolean, {defaultValue: false})
    isFeatured: boolean

    @Field(()=> String)
    culturalOrigin: string

    @Field(()=> ArtisanModel, { nullable: true})
    artisan?: ArtisanModel

    @Field(()=> [WishListModel])
    wishList: WishListModel[]

    @Field(()=> [OrderItemModel])
    orderItems: OrderItemModel[]

    @Field(()=> [ReviewsModel])
    reviews: ReviewsModel[]

    @Field(()=> Float)
    price: number

    @Field(()=> String)
    currency: string
}
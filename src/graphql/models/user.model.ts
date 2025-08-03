import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { WishListModel } from "./wishList.model";
import { ReviewsModel } from "./review.model";
import { AddressModel } from "./address.model";
import { Role } from "generated/prisma";
import { OrderModel } from "./order.model";

registerEnumType(Role, {
    name: "Role"
})

@ObjectType()
export class UserModel {
    @Field(()=> Int)
    id: number

    @Field(()=> String)
    fullName: string

    @Field(()=> String)
    email: string

    @Field(()=> String, {nullable: true})
    phone?: string

    @Field(()=> [AddressModel])
    address: AddressModel[]

    @Field(()=> String)
    password: string

    @Field(()=> Role, {defaultValue: Role.CUSTOMER})
    role: Role

    @Field(()=> Boolean, {defaultValue: true})
    isActive: boolean

    @Field(()=> [WishListModel])
    wishList: WishListModel[]

    @Field(()=> [OrderModel])
    Orders: OrderModel[]

    @Field(()=> [ReviewsModel])
    reviews: ReviewsModel[]  
}
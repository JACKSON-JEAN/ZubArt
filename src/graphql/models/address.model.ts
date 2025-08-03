import { Field, Int, ObjectType } from "@nestjs/graphql";
import { OrderModel } from "./order.model";
import { UserModel } from "./user.model";

@ObjectType()
export class AddressModel {
    @Field(() => Int)
    id: number

    @Field(() => String)
    fullName: string

    @Field(() => String)
    phone: string

    @Field(() => String, {nullable: true})
    email?: string

    @Field(() => String)
    line1: string

    @Field(() => String, {nullable: true})
    line2?: string

    @Field(() => String)
    city: string

    @Field(() => String, {nullable: true})
    state?: string

    @Field(() => String)
    country: string

    @Field(() => String, {nullable: true})
    postalCode?: string

    @Field(() => Boolean, {defaultValue: false})
    isDefault: boolean

    @Field(() => UserModel, {nullable: true})
    customer?: UserModel

    @Field(() => [OrderModel])
    orders: OrderModel[]
}
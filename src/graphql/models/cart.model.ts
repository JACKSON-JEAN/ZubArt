import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { UserModel } from "./user.model";
import { CartItem } from "./cartItem.model";

@ObjectType()
export class Cart {
    @Field(() => Int)
    id: number

    @Field(() => [CartItem])
    items: CartItem[]

    @Field(() => UserModel)
    customer: UserModel

    @Field(() => Float)
    totalAmount: number
}
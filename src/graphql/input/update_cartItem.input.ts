import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateCartItem {
    @Field(() => Int)
    artworkId?: number

    @Field(() => Int)
    cartId?: number

    @Field(() => Int)
    quantity?: number

    @Field(() => Float)
    price?: number
}
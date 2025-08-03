import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class AddOrderItemInput {
    @Field(() => Int)
    artworkId: number

    @Field(() => Int)
    quantity: number

    @Field(() => Int)
    orderId: number

    @Field(() => Float)
    price: number
}
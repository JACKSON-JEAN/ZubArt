import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateOrderItemInput {
    @Field(() => Int, { nullable: true})
    artworkId?: number

    @Field(() => Int, {nullable: true})
    quantity?: number

    @Field(() => Int, {nullable: true})
    orderId?: number

    @Field(() => Float, {nullable: true})
    price?: number
}
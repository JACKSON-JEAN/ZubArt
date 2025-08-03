import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class AddReviewsInput {
    @Field(() => Int)
    rating: number

    @Field(() => String, {nullable: true})
    comment?: string

    @Field(() => Int)
    artworkId: number

    @Field(() => Int)
    customerId: number

}
import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateReviewsInput {
    @Field(() => Int, {nullable: true})
    rating?: number

    @Field(() => String, {nullable: true})
    comment?: string

    @Field(() => Int, {nullable: true})
    artworkId?: number

    @Field(() => Int, {nullable: true})
    customerId?: number

}
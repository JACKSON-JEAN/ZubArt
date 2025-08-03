import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateWishListInput {
    @Field(()=> Int, {nullable: true})
    customerId?: number

    @Field(()=> Int, {nullable: true})
    artworkId?: number
}
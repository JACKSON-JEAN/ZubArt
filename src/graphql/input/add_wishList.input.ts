import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class AddWishListInput {
    @Field(()=> Int)
    customerId: number

    @Field(()=> Int)
    artworkId: number
}
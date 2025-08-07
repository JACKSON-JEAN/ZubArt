import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { ArtworkModel } from "./artwork.model";

@ObjectType()
export class CartItem {
    @Field(() => Int)
    id: number

    @Field(() => Int)
    artworkId: number

    @Field(() => ArtworkModel)
    artwork: ArtworkModel

    @Field(() => Int)
    quantity: number

    @Field(() => Float)
    price: number
}
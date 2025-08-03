import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import { ArtworkModel } from "./artwork.model";
import { OrderModel } from "./order.model";

@ObjectType()
export class OrderItemModel {
    @Field(() => Int)
    id: number

    @Field(() => ArtworkModel)
    artwork: ArtworkModel

    @Field(() => Int)
    quantity: number

    @Field(() => Float)
    price: number

    @Field(() => OrderModel)
    order: OrderModel

}
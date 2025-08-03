import { Field, Float, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { UserModel } from "./user.model";
import { OrderItem, OrderStatus } from "generated/prisma";
import { OrderItemModel } from "./orderItem.model";
import { AddressModel } from "./address.model";

registerEnumType(OrderStatus, {
    name: "OrderStatus"
})

@ObjectType()
export class OrderModel {
    @Field(() => Int)
    id: number

    @Field(() => UserModel)
    customer: UserModel

    @Field(() => AddressModel, { nullable: true})
    shippingAddress?: AddressModel

    @Field(() => [OrderItemModel])
    Items: OrderItem[]

    @Field(() => Float)
    totalAmount: number

    @Field(() => OrderStatus, {defaultValue: OrderStatus.PENDING})
    status: OrderStatus
}
import { Field, Float, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { OrderStatus } from "generated/prisma";

registerEnumType(OrderStatus, {
    name: "OrderStatus"
})

@InputType()
export class AddOrderInput {
    @Field(() => Int)
    customerId: number

    @Field(() => Int, { nullable: true})
    shippingAddressId?: number

    @Field(() => Float)
    totalAmount: number

    @Field(() => OrderStatus, {defaultValue: OrderStatus.PENDING})
    status: OrderStatus
}
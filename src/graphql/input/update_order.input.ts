import { Field, Float, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { OrderStatus } from "generated/prisma";

registerEnumType(OrderStatus, {
    name: "OrderStatus"
})

@InputType()
export class UpdateOrderInput {
    @Field(() => Int, {nullable: true})
    customerId?: number

    @Field(() => Int, { nullable: true})
    shippingAddressId?: number

    @Field(() => Float, {nullable: true})
    totalAmount?: number

    @Field(() => OrderStatus, {nullable: true, defaultValue: OrderStatus.PENDING})
    status?: OrderStatus
}
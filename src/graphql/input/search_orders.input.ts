import { Field, Float, InputType, registerEnumType } from "@nestjs/graphql";
import { OrderStatus } from "generated/prisma";

registerEnumType(OrderStatus, {
    name: "OrderStatus"
})

@InputType()
export class SearchOrdersInput {
    @Field(() => String, {nullable: true})
    customerName?: string

    @Field(() => OrderStatus, {nullable: true})
    status?: OrderStatus

    @Field(() => Date, { nullable: true})
    dateFrom?: Date

    @Field(() => Date, { nullable: true})
    dateTo?: Date

    @Field(() => Float, { nullable: true})
    minTotal?: number

    @Field(() => Float, { nullable: true})
    maxTotal?: number

    @Field(() => String, { nullable: true})
    city?: string

    @Field(() => String, {nullable: true})
    country?: string

    
}
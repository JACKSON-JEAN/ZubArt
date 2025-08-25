import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { SubscriberStatus } from "generated/prisma";

registerEnumType(SubscriberStatus,{
    name: "SubscriberStatus"
})

@ObjectType()
export class SubscriberModel {
    @Field(() => Number)
    id: number

    @Field(() => String)
    email: string

    @Field(() => SubscriberStatus, {defaultValue: SubscriberStatus.ACTIVE})
    status: SubscriberStatus
}
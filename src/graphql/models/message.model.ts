import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { MessageStatus } from "generated/prisma";

registerEnumType(MessageStatus, {
    name: "MessageStatus"
})

@ObjectType()
export class MessageModel{
    @Field(() => Int)
    id: number

    @Field(() => String)
    fullName: string

    @Field(() => String)
    email: string

    @Field(() => String)
    message: string

    @Field(() => MessageStatus, {defaultValue: MessageStatus.Unread})
    status: MessageStatus

    @Field(() => Date)
    createdAt: Date
}
import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { IsEmail, IsEnum } from "class-validator";
import { SubscriberStatus } from "generated/prisma";

registerEnumType(SubscriberStatus,{
    name: "SubscriberStatus"
})

@InputType()
export class UpdateSubscriberInput {
    @Field(() => String, {nullable: true})
    @IsEmail({}, {message: "Invalid email format"})
    email?: string

    @Field(() => SubscriberStatus, {nullable: true, defaultValue: SubscriberStatus.ACTIVE})
    @IsEnum(SubscriberStatus, {message: "Status is required"})
    status?: SubscriberStatus
}
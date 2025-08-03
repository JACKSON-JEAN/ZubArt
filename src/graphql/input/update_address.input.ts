import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateAddressInput {
    @Field(() => String, {nullable: true})
    fullName?: string

    @Field(() => String, {nullable: true})
    phone?: string

    @Field(() => String, {nullable: true})
    email?: string

    @Field(() => String, {nullable: true})
    line1?: string

    @Field(() => String, {nullable: true})
    line2?: string

    @Field(() => String, {nullable: true})
    city?: string

    @Field(() => String, {nullable: true})
    state?: string

    @Field(() => String, {nullable: true})
    country?: string

    @Field(() => String, {nullable: true})
    postalCode?: string

    @Field(() => Boolean, {nullable: true, defaultValue: false})
    isDefault?: boolean

    @Field(() => Int, {nullable: true})
    customerId?: number
}
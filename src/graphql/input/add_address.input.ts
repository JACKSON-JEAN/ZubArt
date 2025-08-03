import { Field, InputType, Int } from "@nestjs/graphql";

@InputType()
export class AddAddressInput {
    @Field(() => String)
    fullName: string

    @Field(() => String)
    phone: string

    @Field(() => String, {nullable: true})
    email?: string

    @Field(() => String)
    line1: string

    @Field(() => String, {nullable: true})
    line2?: string

    @Field(() => String)
    city: string

    @Field(() => String, {nullable: true})
    state?: string

    @Field(() => String)
    country: string

    @Field(() => String, {nullable: true})
    postalCode?: string

    @Field(() => Boolean, {defaultValue: false})
    isDefault: boolean

    @Field(() => Int, {nullable: true})
    customerId?: number
}
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateArtisanInput {
    @Field(() => String, {nullable: true})
    fullName?: string

    @Field(() => String, {nullable: true})
    country?: string

    @Field(() => String, {nullable: true})
    biography?: string
}
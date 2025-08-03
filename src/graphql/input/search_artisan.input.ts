import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class SearchArtisanInput {
    @Field(() => String, {nullable: true})
    fullName?: string

    @Field(() => String, {nullable: true})
    country?: string
}
import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class AddArtisanInput {
    @Field(() => String)
    fullName: string

    @Field(() => String)
    country: string

    @Field(() => String)
    biography: string
}
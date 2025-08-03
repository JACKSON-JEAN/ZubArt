import { Field, InputType, Int } from "@nestjs/graphql";
import { MediaType } from "generated/prisma";

@InputType()
export class UpdateArtworkMediaInput{
    @Field(() => String, {nullable: true})
    url?: string

    @Field(() => MediaType, {nullable: true})
    type?: MediaType

    @Field(() => Int, {nullable: true})
    artworkId?: number
}
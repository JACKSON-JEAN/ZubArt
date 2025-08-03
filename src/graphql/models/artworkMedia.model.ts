import { Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { MediaType } from "generated/prisma";
import { ArtworkModel } from "./artwork.model";

registerEnumType(MediaType, {
    name: "MediaType"
})

@ObjectType()
export class ArtworkMediaModel{
    @Field(() => Int)
    id: number

    @Field(() => String)
    url: string

    @Field(() => MediaType)
    type: MediaType

    @Field(() => ArtworkModel)
    artwork: ArtworkModel
}
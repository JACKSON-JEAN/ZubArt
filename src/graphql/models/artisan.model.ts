import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ArtworkModel } from "./artwork.model";

@ObjectType()
export class ArtisanModel {
    @Field(() => Int)
    id: number

    @Field(() => String)
    fullName: string

    @Field(() => String)
    country: string

    @Field(() => String)
    biography: string

    @Field(() => [ArtworkModel])
    artwork: ArtworkModel[]
}
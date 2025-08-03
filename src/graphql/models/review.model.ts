import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ArtworkModel } from "./artwork.model";
import { UserModel } from "./user.model";

@ObjectType()
export class ReviewsModel {
    @Field(() => Int)
    id: number

    @Field(() => Int)
    rating: number

    @Field(() => String, {nullable: true})
    comment?: string

    @Field(() => ArtworkModel)
    artwork: ArtworkModel

    @Field(() => UserModel)
    customer: UserModel

}
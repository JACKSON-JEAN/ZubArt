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

    @Field(() => String, {nullable: true})
    clientName?: string

    @Field(() => ArtworkModel, {nullable: true})
    artwork?: ArtworkModel

    @Field(() => UserModel, {nullable: true})
    customer?: UserModel

    @Field(() => Boolean, {nullable: true, defaultValue: false})
    isActive?: boolean

}
import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ArtworkModel } from "./artwork.model";
import { UserModel } from "./user.model";

@ObjectType()
export class WishListModel {
    @Field(()=> Int)
    id: number

    @Field(()=> UserModel)
    customer: UserModel

    @Field(()=> ArtworkModel)
    artwork: ArtworkModel

}
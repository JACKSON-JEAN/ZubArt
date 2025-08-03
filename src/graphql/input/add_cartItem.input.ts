import { Field, Float, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsNotEmpty, IsNumber } from "class-validator";

@InputType()
export class AddCartItemInput {
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    artworkId: number

    @Field(() => Int, {nullable: true})
    cartId?: number

    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    quantity: number

    @Field(() => Float)
    @IsNumber()
    @IsNotEmpty()
    price: number
}
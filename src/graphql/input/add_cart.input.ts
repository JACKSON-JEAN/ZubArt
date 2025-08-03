import { Field, Float, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsNotEmpty } from "class-validator";

@InputType()
export class AddCartInput{
    @Field(() => Int)
    @IsInt()
    @IsNotEmpty()
    customerId: number

    @Field(() => Float)
    @IsInt()
    @IsNotEmpty()
    totalAmount: number
}
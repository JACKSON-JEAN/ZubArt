import { Field, Float, InputType, Int } from "@nestjs/graphql";
import { IsInt, IsNotEmpty } from "class-validator";

@InputType()
export class UpdateCartInput{
    @Field(() => Int)
    customerId: number

    @Field(() => Float)
    totalAmount: number
}
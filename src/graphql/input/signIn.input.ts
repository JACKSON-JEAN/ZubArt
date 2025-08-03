import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty } from "class-validator";

@InputType()
export class SigInInput {
    @Field(()=>String)
    @IsEmail()
    email: string

    @Field(()=>String)
    @IsNotEmpty()
    password: string

}
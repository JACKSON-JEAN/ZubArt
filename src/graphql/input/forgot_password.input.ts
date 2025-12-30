import { Field, InputType } from "@nestjs/graphql";
import { IsEmail } from "class-validator";

@InputType()
export class ForgotPasswordInput {
  @Field()
  @IsEmail({}, {message: "Invalid email format"})
  email: string;
}

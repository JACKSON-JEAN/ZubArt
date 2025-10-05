import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PaymentTestResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true }) // Add this field
  token?: string;
}
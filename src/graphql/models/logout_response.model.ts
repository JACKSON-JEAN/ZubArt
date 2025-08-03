import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class LogoutResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}

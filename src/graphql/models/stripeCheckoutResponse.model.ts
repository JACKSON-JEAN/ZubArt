import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class StripeCheckoutResponse {
  @Field()
  sessionUrl: string;

  @Field()
  sessionId: string;
}

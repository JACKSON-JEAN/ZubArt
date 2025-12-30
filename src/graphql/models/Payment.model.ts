import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PaymentResponse {
  @Field()
  orderTrackingId: string;

  @Field()
  paymentRedirectUrl: string;
}

@ObjectType()
export class PaymentStatus {
  @Field()
  success: boolean;

  @Field()
  orderStatus: string;

  @Field()
  paymentMethod: string;

  @Field()
  message: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field()
  reference: string;
}
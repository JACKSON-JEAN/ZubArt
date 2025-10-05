import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class InitiatePaymentInput {
  @Field()
  orderId: number;

  @Field()
  callbackUrl: string;
}

@InputType()
export class PesapalCallbackInput {
  @Field()
  orderTrackingId: string;

  @Field()
  paymentMethod: string;
}
import { ObjectType, Field, Float, InputType } from '@nestjs/graphql';

@ObjectType()
export class PaymentResponse {
  @Field()
  orderTrackingId: string;

  @Field()
  paymentRedirectUrl: string;
}

@ObjectType()
export class PaymentStatusResponse {
  @Field()
  status: string;

  @Field()
  message: string;

  @Field()
  payment_method: string;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field({ nullable: true })
  currency?: string;
}

@ObjectType()
export class WebhookResponse {
  @Field()
  status: string;
}

@InputType()
export class PayPalWebhookInput {
  @Field(() => String)
  body: string;

  @Field(() => String, { nullable: true })
  headers?: string;
}

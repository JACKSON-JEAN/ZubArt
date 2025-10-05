import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PaymentInitiateResponse {
  @Field()
  orderTrackingId: string;

  @Field()
  paymentRedirectUrl: string;
}

@ObjectType()
export class PaymentCallbackResponse {
  @Field()
  success: boolean;

  @Field()
  orderStatus: string;

  @Field()
  paymentMethod: string;

  @Field()
  message: string;

  @Field()
  amount: number;

  @Field()
  currency: string;

  @Field()
  reference: string;
}

@ObjectType()
export class PaymentStatusResponse {
  @Field()
  status: string;

  @Field()
  message: string;

  @Field()
  payment_method: string;

  @Field()
  merchant_reference: string;

  @Field()
  payment_tracking_id: string;
}

@ObjectType()
export class CredentialTestResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class RegisteredIpn {
  @Field()
  url: string;

  @Field()
  ipn_id: string;

  @Field()
  ipn_status: number;

  @Field()
  ipn_status_description: string;

  @Field()
  ipn_notification_type_description: string;

  @Field({ nullable: true })
  created_date?: string;
}

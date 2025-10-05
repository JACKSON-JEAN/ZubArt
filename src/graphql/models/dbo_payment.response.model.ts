// payment-response.dto.ts
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DPOPaymentResponse {
  @Field()
  orderTrackingId: string;

  @Field()
  paymentRedirectUrl: string;
}

@ObjectType()
export class DPOCallbackResponse {
  @Field()
  status: string;

  @Field()
  message: string;
}

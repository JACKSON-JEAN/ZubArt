import { ObjectType, Field, Float } from '@nestjs/graphql';
import { OrderModel } from './order.model';

@ObjectType()
export class PesapalPaymentResponse {
  @Field()
  redirectUrl: string;
}

@ObjectType()
export class PesapalPaymentStatusResponse {
  @Field()
  status: string;
}

@ObjectType()
export class PaymentModel {
  @Field()
  id: number;

  @Field(() => OrderModel)
  order: OrderModel;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  transactionId: string;

  @Field(() => String)
  paymentMethod: string;

  @Field(() => String, {nullable: true})
  paymentProvider?: string;

  @Field(() => String)
  paymentReference: string;

  @Field(() => String)
  status: string;

  @Field(() => Date)
  createdAt: Date;


}

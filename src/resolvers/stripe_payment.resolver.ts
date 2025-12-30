import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { StripePaymentService } from '../services/stripe.payment.service';
import { BadRequestException } from '@nestjs/common';
import { StripeCheckoutResponse } from 'src/graphql/models/stripeCheckoutResponse.model';
import { PaymentModel } from 'src/graphql/models/pesapal_payment.model';

@Resolver()
export class StripePaymentResolver {
  constructor(private readonly stripeService: StripePaymentService) {}

@Mutation(() => StripeCheckoutResponse, { description: 'Create a Stripe checkout session and return redirect URL' })
async createStripeCheckoutSession(@Args('orderId', { type: () => Number }) orderId: number) {
  try {
    return await this.stripeService.createCheckoutSession(orderId);
  } catch (err) {
    throw new BadRequestException(err.message || 'Failed to create Stripe checkout session');
  }
}

  @Query(() => String)
  async getPaymentReport(@Args('sessionId') sessionId: string) {
    // optional: find payment by sessionId and return a JSON string or structured type
    // implement using prisma or a dedicated GraphQL type
    return 'implement as needed';
  }

    @Query(() => PaymentModel)
  async getClientPaymentReport(@Args("trackingId") trackingId: string){
    return await this.stripeService.getClientPaymentReport(trackingId)
  }
}

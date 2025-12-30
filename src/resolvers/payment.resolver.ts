

// import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
// import { PaymentService } from 'src/services/payment.service';
// import { PaymentResponse, PaymentStatusResponse, PayPalWebhookInput, WebhookResponse } from 'src/graphql/models/paypal.model';

// @Resolver()
// export class PaymentResolver {
//   constructor(private readonly paymentService: PaymentService) {}

//   // Initiate a payment for an order
//   @Mutation(() => PaymentResponse)
//   async initiatePayment(@Args('orderId') orderId: number) {
//     return this.paymentService.initiatePayment(orderId);
//   }

//   Get the status of a payment
//   @Query(() => PaymentStatusResponse)
//   async paymentStatus(@Args('orderTrackingId') orderTrackingId: string) {
//     return this.paymentService.getPaymentStatus(orderTrackingId);
//   }

//   // For handling webhook (PayPal)
//   @Mutation(() => WebhookResponse)
// async handlePayPalWebhook(@Args('input') input: PayPalWebhookInput) {
//   const body = JSON.parse(input.body);
//   const headers = input.headers ? JSON.parse(input.headers) : {};
//   return this.paymentService.handlePayPalWebhook(body, headers);
// }

// @Mutation(() => PaymentStatusResponse)
// async capturePayment(@Args('orderTrackingId') orderTrackingId: string) {
//   return this.paymentService.capturePayment(orderTrackingId);
// }


// }

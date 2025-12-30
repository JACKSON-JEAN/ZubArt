// import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
// import { BadRequestException } from '@nestjs/common';
// import { PesapalPaymentService } from 'src/services/pesapal.payment.service';
// import { PaymentModel, PesapalPaymentResponse, PesapalPaymentStatusResponse } from 'src/graphql/models/pesapal_payment.model';
// import { OrderModel } from '../graphql/models/order.model';

// @Resolver()
// export class PesapalPaymentResolver {
//   constructor(private readonly paymentService: PesapalPaymentService) {}

//   @Mutation(() => PesapalPaymentResponse, {
//     description: 'Initiate a Pesapal payment and get redirect URL',
//   })
//   async initiatePesapalPayment(
//     @Args('orderId', { type: () => Number }) orderId: number,
//   ): Promise<PesapalPaymentResponse> {
//     try {
//       const { redirectUrl } = await this.paymentService.initiatePayment(orderId);
//       return { redirectUrl };
//     } catch (error: any) {
//       throw new BadRequestException(error.message || 'Failed to initiate payment');
//     }
//   }

//   @Query(() => PesapalPaymentStatusResponse, {
//     description: 'Verify a payment status from Pesapal',
//   })
//   async verifyPesapalPayment(
//     @Args('orderTrackingId', { type: () => String }) orderTrackingId: string,
//   ): Promise<PesapalPaymentStatusResponse> {
//     try {
//       const { status } = await this.paymentService.verifyPayment(orderTrackingId);
//       return { status };
//     } catch (error: any) {
//       throw new BadRequestException(error.message || 'Failed to verify payment');
//     }
//   }

//   @Query(() => PaymentModel)
//   async getClientPaymentReport(@Args("trackingId") trackingId: string){
//     return await this.paymentService.getClientPaymentReport(trackingId)
//   }
// }

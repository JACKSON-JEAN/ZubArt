// import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
// import { DPOPaymentService } from '../services/dpo.payment.service';
// import { DPOPaymentResponse, DPOCallbackResponse } from 'src/graphql/models/dbo_payment.response.model';

// @Resolver()
// export class DPOPaymentResolver {
//   constructor(private readonly dpoPaymentService: DPOPaymentService) {}

//   @Mutation(() => DPOPaymentResponse)
//   async initiateDPOPayment(@Args('orderId') orderId: number): Promise<DPOPaymentResponse> {
//     return this.dpoPaymentService.initiatePayment(orderId);
//   }

//   // Debug-only query for simulating callback verification
//   @Query(() => DPOCallbackResponse)
//   async handleDpoCallback(
//     @Args('TransactionToken') TransactionToken: string,
//     @Args('Result') Result: string,
//     @Args('ResultExplanation', { nullable: true }) ResultExplanation?: string,
//   ): Promise<DPOCallbackResponse> {
//     return this.dpoPaymentService.handleCallback({
//       TransactionToken,
//       Result,
//       ResultExplanation,
//     });
//   }
// }

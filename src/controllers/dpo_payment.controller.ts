// import { Controller, Get, Query, Logger } from '@nestjs/common';
// import { DPOPaymentService } from '../services/dpo.payment.service';

// @Controller('payment')
// export class DPOPaymentController {
//   private readonly logger = new Logger(DPOPaymentController.name);

//   constructor(
//     private readonly dpoPaymentService: DPOPaymentService,
//   ) {}

//   /** DPO success callback (GET) */
//   @Get('success')
//   async handleSuccess(@Query() query: any) {
//     this.logger.log(`📞 DPO Success Callback received: ${JSON.stringify(query)}`);
//     try {
//       const result = await this.dpoPaymentService.verifyPayment(query.TransactionToken);
//       return result;
//     } catch (error: any) {
//       this.logger.error('Error verifying DPO transaction', error);
//       return { status: 'failed', message: error.message || 'Failed to verify payment', data: query };
//     }
//   }

//   /** DPO cancel callback */
//   @Get('cancel')
//   async handleCancel(@Query() query: any) {
//     this.logger.warn('DPO Cancel Callback received:', query);
//     return { status: 'cancelled', message: 'Payment was cancelled by the user', data: query };
//   }

//   /** Optional POST callback for server-to-server notifications */
//   // @Post('callback')
//   // async handlePostCallback(@Body() body: any) {
//   //   this.logger.log(`📞 DPO POST Callback received: ${JSON.stringify(body)}`);
//   //   try {
//   //     const result = await this.dpoPaymentService.verifyPayment(body.TransactionToken);
//   //     return result;
//   //   } catch (error: any) {
//   //     this.logger.error('Error verifying DPO transaction', error);
//   //     return { status: 'failed', message: error.message || 'Failed to verify payment', data: body };
//   //   }
//   // }



//   /** Root endpoint for testing */
//   @Get()
//   async root() {
//     return { status: 'success', message: 'Server is running', timestamp: new Date().toISOString() };
//   }
// }

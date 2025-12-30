// import { Controller, Get, Post, Query, Body, Logger, Res } from '@nestjs/common';
// import { PesapalPaymentService } from '../services/pesapal.payment.service';
// import { Response } from 'express';
// import { ConfigService } from '@nestjs/config';

// @Controller('payment')
// export class PaymentController {
//   private readonly logger = new Logger(PaymentController.name);

//   constructor(
//     private readonly pesapalPaymentService: PesapalPaymentService,
//     private readonly configService: ConfigService
//   ) {}

//  @Get('callback')
// async handleCallback(
//   @Query('OrderTrackingId') orderTrackingId: string,
//   @Res() res: Response
// ) {
//   this.logger.log(`Pesapal Callback received for OrderTrackingId: ${orderTrackingId}`);

//   const frontendUrl = this.configService.get<string>('FRONTEND_URL');

//   if (!orderTrackingId) {
//     return res.status(400).json({ status: 'failed', message: 'Missing OrderTrackingId' });
//   }

//   try {
//     const result = await this.pesapalPaymentService.verifyPayment(orderTrackingId);

//     // Pesapal returns something like: { status: 'PAID' | 'PROCESSING' | 'CANCELLED' }
//     const status = result.status?.toUpperCase();

//     if (status === 'PAID') {
//       return res.redirect(`${frontendUrl}/payment-success?trackingId=${orderTrackingId}`);
//     } else if (status === 'CANCELLED') {
//       return res.redirect(`${frontendUrl}/payment-failed?trackingId=${orderTrackingId}`);
//     } else if (status === 'PROCESSING') {
//       return res.redirect(`${frontendUrl}/payment-pending?trackingId=${orderTrackingId}`);
//     } else {
//       // fallback if an unexpected status appears
//       return res.redirect(`${frontendUrl}/payment-failed?trackingId=${orderTrackingId}`);
//     }
//   } catch (error: any) {
//     this.logger.error('Error verifying Pesapal transaction', error.response?.data || error.message);
//     return res
//       .status(500)
//       .json({ status: 'failed', message: error.message || 'Verification failed' });
//   }
// }



//   /**
//    * IPN notification (server-to-server)
//    */
//   @Post('ipn')
//   async handleIpn(@Body() body: any) {
//     this.logger.log(`Pesapal IPN received: ${JSON.stringify(body)}`);
//     const { OrderTrackingId } = body;
//     if (!OrderTrackingId) {
//       return { status: 'failed', message: 'Missing OrderTrackingId' };
//     }
//     try {
//       const result = await this.pesapalPaymentService.verifyPayment(OrderTrackingId);
//       return { status: 'success', data: result };
//     } catch (error: any) {
//       this.logger.error('Error handling Pesapal IPN', error.response?.data || error.message);
//       return { status: 'failed', message: error.message || 'IPN verification failed' };
//     }
//   }

//   /**
//    * Root endpoint for testing
//    */
//   @Get()
//   async root() {
//     return { status: 'success', message: 'Server is running', timestamp: new Date().toISOString() };
//   }
// }

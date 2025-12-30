import {
  Controller,
  Post,
  Req,
  Res,
  Logger,
  Body,
  Headers,
} from '@nestjs/common';
import { StripePaymentService } from '../services/stripe.payment.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';

@Controller('stripe')
export class StripePaymentController {
  private logger = new Logger(StripePaymentController.name);
  constructor(private readonly stripeService: StripePaymentService) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string | undefined;

    try {
      const event = this.stripeService.constructEvent(req.body, sig || '');
      this.logger.log(`Received Stripe event: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.stripeService.handleCheckoutCompleted(session);
      }

      // Always respond 200 unless critical parsing error
      res.status(200).send({ received: true });
    } catch (err) {
      this.logger.error('Stripe webhook handling failed', err);
      // Only send 400 for signature verification errors
      if (err.message?.includes('Webhook signature verification failed')) {
        res.status(400).send(`Webhook Error: ${err.message}`);
      } else {
        // Internal errors: log but respond 200 so Stripe doesn't retry
        res.status(200).send({ received: true, error: err.message });
      }
    }
  }
}

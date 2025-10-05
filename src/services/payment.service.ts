import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { OrderStatus } from 'generated/prisma';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private paypalClient: paypal.core.PayPalHttpClient;
  private environment: string;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.initializePayPal();
  }

  private initializePayPal() {
    this.environment = this.configService.get<string>('PAYPAL_ENVIRONMENT') || 'sandbox';
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    this.logger.log(`PayPal Environment: ${this.environment}`);
    this.logger.log(`PayPal Client ID exists: ${!!clientId}`);

    if (!clientId || !clientSecret) {
      this.logger.warn('PayPal credentials not found. Payment functionality will be disabled.');
      return;
    }

    const env =
      this.environment === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    this.paypalClient = new paypal.core.PayPalHttpClient(env);
  }

  async initiatePayment(orderId: number) {
    const useMock = this.configService.get('USE_MOCK_PAYMENT') === 'true';

    if (useMock) {
      return this.initiateMockPayment(orderId);
    }

    if (!this.paypalClient) {
      throw new BadRequestException('Payment service is not configured');
    }

    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: { include: { artwork: true } } },
    });

    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Order is not in a payable state');

    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId.toString(),
            amount: { currency_code: 'USD', value: order.totalAmount.toString() },
            description: `Payment for order #${order.id}`,
          },
        ],
        application_context: {
          return_url: `${this.configService.get('APP_URL')}/payment/success`,
          cancel_url: `${this.configService.get('APP_URL')}/payment/cancel`,
          brand_name: 'Pearl Art Galleries',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      });

      this.logger.log('Creating PayPal order...');
      const response = await this.paypalClient.execute(request);
      const paypalOrder = response.result;

      this.logger.log(`PayPal Order created: ${paypalOrder.id}`);

      await this.prismaService.order.update({
        where: { id: orderId },
        data: { paymentReference: paypalOrder.id, paymentProvider: 'PAYPAL' },
      });

      const approveLink = paypalOrder.links.find(link => link.rel === 'approve');
      if (!approveLink) throw new BadRequestException('No approval link found in PayPal response');

      return { orderTrackingId: paypalOrder.id, paymentRedirectUrl: approveLink.href };
    } catch (error: any) {
      this.logger.error('PayPal payment initiation failed', error.stack);
      throw new BadRequestException(
        `Payment initiation failed: ${error.message}. Please check your configuration.`,
      );
    }
  }

  async capturePayment(paypalOrderId: string) {
    try {
      // Check PayPal order status
      const getRequest = new paypal.orders.OrdersGetRequest(paypalOrderId);
      const orderResult = await this.paypalClient.execute(getRequest);

      if (orderResult.result.status === 'COMPLETED') {
        this.logger.warn(`Order ${paypalOrderId} already captured`);
        return orderResult.result;
      }

      const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
      const response = await this.paypalClient.execute(request);

      const referenceId = response.result.purchase_units?.[0]?.reference_id;
      if (referenceId) {
        await this.handleSuccessfulPayment(parseInt(referenceId, 10), response.result.id);
      }

      this.logger.log(`Payment captured: ${response.result.id}`);
      return response.result;
    } catch (error: any) {
      this.logger.error('Payment capture failed', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        debug_id: error.headers?.['paypal-debug-id'],
      });

      throw new BadRequestException({
        message: 'Payment capture failed',
        reason: error.details?.[0]?.description || error.message,
        debugId: error.headers?.['paypal-debug-id'],
      });
    }
  }

  async handlePayPalWebhook(body: any, headers: any) {
    try {
      const eventType = body.event_type;
      const resource = body.resource;
      this.logger.log(`PayPal Webhook received: ${eventType}`);

      const purchaseUnit = resource.purchase_units?.[0];
      if (!purchaseUnit || !purchaseUnit.reference_id) {
        throw new BadRequestException('Invalid webhook payload');
      }

      const orderId = parseInt(purchaseUnit.reference_id, 10);

      if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        await this.handleSuccessfulPayment(orderId, resource.id);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Webhook processing failed', error.stack);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  private async handleSuccessfulPayment(orderId: number, transactionId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new BadRequestException('Order not found');

    await this.prismaService.$transaction(async prisma => {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'USD',
          paymentMethod: 'PAYPAL',
          paymentProvider: 'PAYPAL',
          paymentReference: transactionId,
          status: 'COMPLETED',
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      const artworkIds = order.items.map(item => item.artworkId);
      await prisma.artwork.updateMany({
        where: { id: { in: artworkIds }, isUnique: true },
        data: { isAvailable: false, reservedUntil: null },
      });
    });

    this.logger.log(`Payment processed successfully for order: ${orderId}`);
  }

  private async initiateMockPayment(orderId: number) {
    const order = await this.prismaService.order.findUnique({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Order not found');

    const mockTrackingId = `mock_${Date.now()}_${orderId}`;

    await this.prismaService.order.update({
      where: { id: orderId },
      data: { paymentReference: mockTrackingId, paymentProvider: 'MOCK' },
    });

    return {
      orderTrackingId: mockTrackingId,
      paymentRedirectUrl: `${this.configService.get('APP_URL')}/payment/callback?OrderTrackingId=${mockTrackingId}&PaymentMethod=MOCK`,
    };
  }

  async getPaymentStatus(orderTrackingId: string) {
    try {
      if (orderTrackingId.startsWith('mock_')) {
        return {
          status: 'COMPLETED',
          message: 'Mock payment completed successfully',
          payment_method: 'MOCK',
        };
      }

      const request = new paypal.orders.OrdersGetRequest(orderTrackingId);
      const response = await this.paypalClient.execute(request);
      const order = response.result;

      return {
        status: order.status,
        message: `Payment ${order.status.toLowerCase()}`,
        payment_method: 'PAYPAL',
        amount: order.purchase_units[0].amount.value,
        currency: order.purchase_units[0].amount.currency_code,
      };
    } catch (error) {
      this.logger.error('Failed to get payment status', error);
      return {
        status: 'UNKNOWN',
        message: 'Could not retrieve payment status',
        payment_method: 'UNKNOWN',
      };
    }
  }
}

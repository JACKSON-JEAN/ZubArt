import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from './prisma.service';
import { OrderStatus } from 'generated/prisma';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PesapalPaymentService {
  private readonly logger = new Logger(PesapalPaymentService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly notificationId: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('PESAPAL_BASE_URL', '');
    this.apiKey = this.configService.get<string>('PESAPAL_CONSUMER_KEY', '');
    this.apiSecret = this.configService.get<string>('PESAPAL_CONSUMER_SECRET', '');
    this.notificationId = this.configService.get<string>('PESAPAL_NOTIFICATION_ID', '');
    this.appUrl = this.configService.get<string>('PESAPAL_APP_URL', '');
  }

  /**
   * Authenticate with Pesapal
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/Auth/RequestToken`, {
          consumer_key: this.apiKey,
          consumer_secret: this.apiSecret,
        }),
      );

      if (!response.data?.token) {
        throw new BadRequestException('Authentication failed, no token received');
      }

      return response.data.token;
    } catch (error) {
      this.logger.error('Pesapal authentication failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to authenticate with Pesapal');
    }
  }

  /**
   * Initiate a payment
   */
  async initiatePayment(orderId: number) {
    const token = await this.authenticate();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not payable');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/Transactions/SubmitOrderRequest`,
          {
            id: `${order.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            currency: 'USD',
            amount: Number(order.totalAmount.toFixed(2)),
            description: `Payment for Order #${order.id}`,
            callback_url: `${this.appUrl}/payment/callback`,
            notification_id: this.notificationId,
            billing_address: {
              email_address: order.customer.email,
              phone_number: order.customer.phone || '000000000',
              first_name: order.customer.fullName.split(' ')[0],
              last_name:
                order.customer.fullName.split(' ').slice(1).join(' ') || 'Customer',
            },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );

      const { redirect_url, order_tracking_id } = response.data;

      if (!redirect_url || !order_tracking_id) {
        console.log('Pesapal response:', response.data);
        throw new BadRequestException('Pesapal did not return redirect URL or tracking ID');
      }

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentReference: order_tracking_id,
          paymentProvider: 'PESAPAL',
          status: OrderStatus.PROCESSING,
        },
      });

      return { redirectUrl: redirect_url };
    } catch (error) {
      this.logger.error('Payment initiation failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to initiate payment');
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(orderTrackingId: string) {
    const token = await this.authenticate();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );

      const { status } = response.data;
      console.log('Pesapal transaction status:', status);
      console.log('Pesapal response:', response.data);

      const paymentStatus = response.data.payment_status_description;

      let orderStatus: OrderStatus;
      if (paymentStatus === 'Completed') {
        orderStatus = OrderStatus.PAID;
      } else if (paymentStatus === 'Pending') {
        orderStatus = OrderStatus.PROCESSING;
      } else {
        orderStatus = OrderStatus.CANCELLED;
      }

      const updatedOrder = await this.prisma.order.update({
        where: { paymentReference: orderTrackingId },
        data: { status: orderStatus },
        include: { customer: true },
      });

      // Only create Payment record if successful
      if (orderStatus === OrderStatus.PAID) {
        await this.prisma.payment.create({
          data: {
            orderId: updatedOrder.id,
            amount: response.data.amount,
            currency: response.data.currency || 'USD',
            paymentMethod: response.data.payment_method || 'UNKNOWN',
            paymentProvider: 'PESAPAL',
            paymentReference: orderTrackingId,
            status: paymentStatus || 'FAILED',
          },
        });

        // Send Email Notifications
        await this.sendPaymentEmails(updatedOrder, response.data);
      }

      return { status: orderStatus };
    } catch (error) {
      this.logger.error('Payment verification failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to verify payment');
    }
  }

  // Get payment report
  async getClientPaymentReport(trackingId: string){
    const report = await this.prisma.payment.findUnique({
      where: {paymentReference: trackingId},
      include: {
        order: {include: {items: {include: {artwork: true}}}}
      }
    })

    if(!report){
      throw new NotFoundException(`Payment for tracking ID ${trackingId} is not found!`)
    }
    return report
  }

  /**
   * Send email notifications to client + merchant
   */
  private async sendPaymentEmails(order: any, paymentData: any) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASS'),
        },
      });

      const merchantEmail = this.configService.get<string>('MERCHANT_EMAIL');
      const clientEmail = order.customer.email;

      // HTML email for client
      const clientHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
  <tr>
    <td align="center">
      <!-- Outer container -->
      <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 2px; overflow: hidden;">
        
        <!-- Hero Banner -->
        <tr>
          <td style=" padding: 0px 30px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #450a0a;">Pearl Art Galleries</h1>
            <p style="margin: 10px 0 0; font-size: 16px; line-height: 1.5;">
              <strong>Your payment was successful!</strong>
            </p>
          </td>
        </tr>

        <!-- Order Details -->
        <tr>
          <td style="padding: 30px; color: #333;">
            <p style="margin: 0 0 20px; font-size: 16px;">Hi ${order.customer.fullName},</p>
            <p style="margin: 0 0 20px; font-size: 16px;">Thanks for your payment! We have safely received it.</p>
            <p style="margin: 0 0 20px; font-size: 16px;">Here are the details of your order:</p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 12px; border: 1px solid #eee; font-weight: bold;">Order ID</td>
                <td style="padding: 12px; border: 1px solid #eee;">${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #eee; font-weight: bold;">Amount</td>
                <td style="padding: 12px; border: 1px solid #eee;">${paymentData.currency} ${paymentData.amount}</td>
              </tr>
            </table>

            <!-- CTA Button -->
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://pearlartgalleries.com/collection" style="
                background: #450a0a; 
                color: #fef3c7; 
                text-decoration: none; 
                font-weight: bold; 
                padding: 12px 25px; 
                border-radius: 2px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                display: inline-block;
              ">Shop More Art</a>
            </p>

            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">Pearl Art Galleries</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;



    // HTML email for merchant
    const merchantHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50;">New Payment Received</h2>
        <p>Order <strong>#${order.id}</strong> has been paid successfully.</p>
        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;">Customer</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${order.customer.fullName} (${clientEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;">Amount</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${paymentData.currency} ${paymentData.amount}</td>
          </tr>
        </table>
        <p style="color: #888;">Pearl Art Galleries</p>
      </div>
    `;

      await transporter.sendMail({
      from: `"Pearl Art Galleries" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: clientEmail,
      subject: `Payment Successful - Order #${order.id}`,
      html: clientHtml, 
    });

    // Send to merchant
    await transporter.sendMail({
      from: `"Pearl Art Galleries" <${this.configService.get<string>('EMAIL_USER')}>`,
      to: merchantEmail,
      subject: `New Payment Received - Order #${order.id}`,
      html: merchantHtml, // use html instead of text
    });

      this.logger.log(`Payment emails sent to ${clientEmail} and ${merchantEmail}`);
    } catch (err) {
      this.logger.error('Failed to send payment emails', err.message);
    }
  }
}

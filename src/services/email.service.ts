import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'), // your gmail
        pass: this.configService.get<string>('EMAIL_PASS'), // your app password
      },
    });
  }

  async sendPaymentSuccessEmail(
    clientEmail: string,
    orderId: number,
    amount: number,
    currency: string,
    paymentMethod: string,
  ) {
    try {
      const merchantEmail = this.configService.get<string>('MERCHANT_EMAIL');

      const subject = `Payment Confirmation - Order #${orderId}`;
      const message = `
        <h2>Payment Successful 🎉</h2>
        <p>Your payment for <b>Order #${orderId}</b> has been successfully processed.</p>
        <p><b>Amount:</b> ${currency} ${amount}</p>
        <p><b>Payment Method:</b> ${paymentMethod}</p>
        <br/>
        <p>Thank you for shopping with us!</p>
      `;

      // Send to client
      await this.transporter.sendMail({
        from: `"Payments" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: clientEmail,
        subject,
        html: message,
      });

      // Send to merchant/admin
      await this.transporter.sendMail({
        from: `"Payments" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: merchantEmail,
        subject: `New Payment Received - Order #${orderId}`,
        html: `
          <h2>New Payment Received ✅</h2>
          <p><b>Order ID:</b> ${orderId}</p>
          <p><b>Amount:</b> ${currency} ${amount}</p>
          <p><b>Method:</b> ${paymentMethod}</p>
          <p><b>Client Email:</b> ${clientEmail}</p>
        `,
      });

      this.logger.log(
        `Payment confirmation emails sent for Order #${orderId} (Client: ${clientEmail}, Merchant: ${merchantEmail})`,
      );
    } catch (error) {
      this.logger.error('Failed to send payment confirmation emails', error);
    }
  }
}

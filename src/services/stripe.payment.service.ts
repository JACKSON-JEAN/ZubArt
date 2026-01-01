import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { OrderStatus } from 'generated/prisma';
import * as nodemailer from 'nodemailer';
import * as SibApiV3Sdk from '@sendinblue/client';
import { v2 as cloudinary } from 'cloudinary';
import { jsPDF } from 'jspdf';
import * as dayjs from 'dayjs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private stripe: Stripe;
  private webhookSecret: string;
  private successUrl: string;
  private cancelUrl: string;

  constructor(
    private readonly config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secret) throw new Error('STRIPE_SECRET_KEY missing');
    this.stripe = new Stripe(secret);

    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
    this.successUrl = this.config.get<string>('STRIPE_SUCCESS_URL')!;
    this.cancelUrl = this.config.get<string>('STRIPE_CANCEL_URL')!;
    if (!this.successUrl || !this.cancelUrl) {
      throw new Error('STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL missing');
    }
  }

  // -------------------------------
  // CREATE STRIPE CHECKOUT SESSION
  // -------------------------------
  async createCheckoutSession(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: { include: { artwork: true } } },
    });

    if (!order) throw new BadRequestException('Order not found');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('Order is not payable');

    const line_items = order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.artwork.title,
          description: item.artwork.description?.slice(0, 200) || undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: order.customer.email,
      metadata: { orderId: String(order.id) },
      success_url: this.successUrl,
      cancel_url: this.cancelUrl,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id,
        paymentProvider: 'STRIPE',
        status: OrderStatus.PROCESSING,
      },
    });

    return { sessionUrl: session.url, sessionId: session.id };
  }

  // -------------------------------
  // STRIPE WEBHOOK PARSING
  // -------------------------------
  constructEvent(payload: Buffer, sigHeader: string) {
    if (!this.webhookSecret) {
      try {
        return JSON.parse(payload.toString());
      } catch (err) {
        this.logger.error(
          'Failed to parse webhook payload without secret',
          err,
        );
        throw new BadRequestException('Invalid webhook payload');
      }
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        sigHeader,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(
        'Stripe webhook signature verification failed',
        err.message,
      );
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  // -------------------------------
  // HANDLE CHECKOUT COMPLETED
  // -------------------------------
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const metadataOrderId = session.metadata?.orderId;
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent as string | undefined;

    if (!metadataOrderId) {
      this.logger.warn('Checkout session missing orderId metadata', sessionId);
      return;
    }

    const orderId = Number(metadataOrderId);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { artwork: true } }, customer: true },
    });
    if (!order) {
      this.logger.warn('Order not found for Stripe session', sessionId);
      return;
    }

    const existing = await this.prisma.payment.findFirst({
      where: { stripeSessionId: sessionId },
    });
    if (existing) {
      this.logger.log('Payment already recorded for session ' + sessionId);
      return;
    }

    let pi: Stripe.PaymentIntent | null = null;
    if (paymentIntentId)
      pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    const amountReceived =
      (pi?.amount_received ??
        session.amount_total ??
        Math.round(order.totalAmount * 100)) / 100;
    const currency = (pi?.currency ?? session.currency ?? 'usd').toUpperCase();

    // -------------------------------
    // CREATE PAYMENT RECORD
    // -------------------------------
    const transactionId = `PAG_${order.id}_${dayjs().format('YYYYMMDD_HHmmss')}`;

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: Number(amountReceived.toFixed(2)),
        currency,
        paymentMethod: pi?.payment_method_types?.[0] ?? 'card',
        paymentProvider: 'STRIPE',
        transactionId,
        paymentReference: sessionId,
        stripeSessionId: sessionId,
        stripePaymentIntentId: pi?.id,
        status: 'PAID',
      },
    });

    // -------------------------------
    // UPDATE ORDER & ARTWORKS
    // -------------------------------
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paymentReference: sessionId },
    });

    for (const item of order.items) {
      await this.prisma.artwork.update({
        where: { id: item.artworkId },
        data: { reservedUntil: null, isAvailable: false },
      });
    }

    const paymentData = {
      reference: sessionId,
      paymentMethod: pi?.payment_method_types?.[0] ?? 'card',
      amount: amountReceived,
      currency,
      transactionId, // <--- add this
    };

    // -------------------------------
    // GENERATE PDF & UPLOAD
    // -------------------------------
    const pdfBuffer = this.generateReceiptPDF(order, paymentData);

    const receiptUrl = await this.uploadReceiptToCloudinary(
      pdfBuffer,
      transactionId,
    );

    // Save receipt URL
    await this.prisma.payment.update({
      where: { stripeSessionId: sessionId },
      data: { receiptUrl },
    });

    // -------------------------------
    // SEND EMAILS
    // -------------------------------
    await this.sendPaymentEmails(
      order,
      {
        reference: sessionId,
        transactionId,
        paymentMethod: pi?.payment_method_types?.[0] ?? 'card',
        amount: amountReceived,
        currency,
        receiptUrl,
      },
      pdfBuffer,
    );

    this.logger.log(
      `Processed Stripe checkout for order ${order.id} (session ${sessionId})`,
    );
  }

  // -------------------------------
  // GENERATE PDF RECEIPT
  // -------------------------------
  private generateReceiptPDF(order: any, paymentData: any): Buffer {
    const doc = new jsPDF();
    const startX = 15;
    const qtyX = 120;
    const priceX = 195;

    // Header
    doc.setFontSize(18);
    doc.text('PEARL ART GALLERIES, LLC', 105, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text('Email: pearlartgalleries@gmail.com', 105, 22, {
      align: 'center',
    });
    doc.text('Phone: +256 776 286 452', 105, 27, { align: 'center' });

    doc.line(15, 35, 195, 35);

    const fullName = order.customer.fullName
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const paymentMethod = paymentData.paymentMethod
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const email = order.customer.email
      ? order.customer.email.toLowerCase()
      : 'N/A';

    let y = 45;
    doc.text(`Customer: ${fullName}`, 15, y);
    y += 7;
    doc.text(`Email: ${email}`, 15, y);
    y += 10;

    doc.text(`Transaction ID: ${paymentData.transactionId}`, 15, y);
    y += 7;
    doc.text(`Order ID: ${order.id}`, 15, y);
    y += 7;

    doc.text(`Payment Method: ${paymentMethod}`, 15, y);
    y += 7;
    doc.text(
      `Date: ${new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })}`,
      15,
      y,
    );
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.text('Order Items', 15, y);
    doc.setFont('helvetica', 'normal'); // reset
    y += 3;

    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);

    doc.text('#', startX, y);
    doc.text('Item', startX + 10, y);
    doc.text('Qty', qtyX, y);
    doc.text('Amount', priceX, y, { align: 'right' });

    y += 5;
    doc.line(startX, y, priceX, y);
    y += 6;

    doc.setTextColor(0);
    doc.setFontSize(11);

    order.items.forEach((item, index) => {
      const title =
        item.artwork.title.charAt(0).toUpperCase() +
        item.artwork.title.slice(1);

      const lineTotal = (item.price * item.quantity).toFixed(2);

      doc.text(String(index + 1), startX, y); // #
      doc.text(title, startX + 10, y); // Item
      doc.text(String(item.quantity), qtyX, y); // Qty
      doc.text(
        `${paymentData.currency} ${lineTotal}`,
        priceX,
        y,
        { align: 'right' }, // Amount
      );

      y += 7;
    });

    const totalAmount = order.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    y += 4;
    doc.line(startX, y, priceX, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', qtyX, y);
    doc.text(`${paymentData.currency} ${totalAmount.toFixed(2)}`, priceX, y, {
      align: 'right',
    });
    doc.setFont('helvetica', 'normal');

    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Thank you for your purchase.', 105, footerY, { align: 'center' });

    doc.text(
      'For questions or support, contact: pearlartgalleries@gmail.com',
      105,
      footerY + 5,
      { align: 'center' },
    );
    doc.setTextColor(0);
    doc.setFontSize(11);

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }

  // -------------------------------
  // UPLOAD PDF TO CLOUDINARY
  // -------------------------------
  private async uploadReceiptToCloudinary(
    pdfBuffer: Buffer,
    transactionId: string,
  ) {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: `receipts/Receipt_${transactionId}`,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result || !result.secure_url)
            return reject(new Error('Cloudinary upload failed'));
          resolve(result.secure_url);
        },
      );
      stream.end(pdfBuffer);
    });
  }

  // -------------------------------
  // SEND EMAILS WITH PDF ATTACHMENT
  // -------------------------------
//   private async sendPaymentEmails(
//     order: any,
//     paymentData: any,
//     pdfBuffer: Buffer,
//   ) {
//     try {
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         port: 465,
//         secure: true,
//         auth: {
//           user: this.config.get<string>('EMAIL_USER'),
//           pass: this.config.get<string>('EMAIL_PASS'),
//         },
//       });

//       const merchantEmail = this.config.get<string>('MERCHANT_EMAIL');
//       const clientEmail = order.customer.email;

//       const itemsHtml = order.items
//         .map(
//           (item) =>
//             `<li><strong>${item.artwork.title}</strong> — Qty ${item.quantity} — ${paymentData.currency} ${(item.price * item.quantity).toFixed(2)}</li>`,
//         )
//         .join('');

//       const clientHtml = `
//         <p>Hello ${order.customer.fullName},</p>
//         <p>Thank you for your purchase. Your payment has been successfully completed.</p>
//         <p>Order #${order.id} — Total Paid: ${paymentData.currency} ${paymentData.amount}</p>
//         <p>Attached is your official receipt.</p>
//         <p>Items Purchased:</p>
//         <ul>${itemsHtml}</ul>
//         <p>Warm regards,<br/>Pearl Art Galleries</p>
//       `;

//       const merchantHtml = `
//         <h2>New Payment Received</h2>
//         <p>Order #${order.id} — Customer: ${order.customer.fullName} (${clientEmail})</p>
//         <p>Payment Method: ${paymentData.paymentMethod} — Total: ${paymentData.currency} ${paymentData.amount}</p>
//         <ul>${itemsHtml}</ul>
//         <p>
//   Receipt URL:
//   <a href="${paymentData.receiptUrl}" target="_blank">
//     View PDF
//   </a>
// </p>
//       `;

//       // Send to client with PDF attachment
//       await transporter.sendMail({
//         from: `"Pearl Art Galleries" <${this.config.get('EMAIL_USER')}>`,
//         to: clientEmail,
//         subject: `Payment Successful - Order ${paymentData.transactionId}`,
//         html: clientHtml,
//         attachments: [
//           {
//             filename: `Receipt_${paymentData.transactionId}.pdf`,
//             content: pdfBuffer,
//           },
//         ],
//       });

//       // Send to merchant
//       await transporter.sendMail({
//         from: `"Pearl Art Galleries" <${this.config.get('EMAIL_USER')}>`,
//         to: merchantEmail,
//         subject: `New Payment Received - Order #${order.id}`,
//         html: merchantHtml,
//       });
//     } catch (err) {
//       this.logger.error('Failed to send payment emails', err);
//     }
//   }

// -------------------------------
// SEND EMAILS WITH PDF ATTACHMENT USING BREVO (Safe-Failed)
// -------------------------------
private async sendPaymentEmails(
  order: any,
  paymentData: any,
  pdfBuffer: Buffer,
) {
  const logger = this.logger;
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    this.config.get('BREVO_API_KEY')!,
  );

  const merchantEmail = this.config.get<string>('MERCHANT_EMAIL');
  const clientEmail = order.customer.email;

  const itemsHtml = order.items
    .map(
      (item) =>
        `<li><strong>${item.artwork.title}</strong> — Qty ${item.quantity} — ${paymentData.currency} ${(item.price * item.quantity).toFixed(2)}</li>`
    )
    .join('');

  const clientHtml = `
    <p>Hello ${order.customer.fullName},</p>
    <p>Thank you for your purchase. Your payment has been successfully completed.</p>
    <p>Order #${order.id} — Total Paid: ${paymentData.currency} ${paymentData.amount}</p>
    <p>Attached is your official receipt.</p>
    <p>Items Purchased:</p>
    <ul>${itemsHtml}</ul>
    <p>Warm regards,<br/>Pearl Art Galleries</p>
  `;

  const merchantHtml = `
    <h2>New Payment Received</h2>
    <p>Order #${order.id} — Customer: ${order.customer.fullName} (${clientEmail})</p>
    <p>Payment Method: ${paymentData.paymentMethod} — Total: ${paymentData.currency} ${paymentData.amount}</p>
    <ul>${itemsHtml}</ul>
    <p>
      Receipt URL:
      <a href="${paymentData.receiptUrl}" target="_blank">View PDF</a>
    </p>
  `;

  // Helper to send email safely
  const safeSendEmail = async (to: string, name: string, subject: string, html: string, attachment?: Buffer) => {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: 'Pearl Art Galleries', email: 'no-reply@pearlartgalleries.com' };
      sendSmtpEmail.to = [{ email: to, name }];
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;

      if (attachment) {
        sendSmtpEmail.attachment = [
          {
            content: attachment.toString('base64'),
            name: `Receipt_${paymentData.transactionId}.pdf`,
          },
        ];
      }

      const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
      logger.log(`Email sent successfully to ${to}, messageId: ${response.body?.messageId}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, error?.response || error);
    }
  };

  // Send client email if email exists
  if (clientEmail) {
    await safeSendEmail(
      clientEmail,
      order.customer.fullName,
      `Payment Successful - Order ${paymentData.transactionId}`,
      clientHtml,
      pdfBuffer,
    );
  } else {
    logger.warn(`Client email missing for order ${order.id}, skipping email`);
  }

  // Send merchant email if email exists
  if (merchantEmail) {
    await safeSendEmail(
      merchantEmail,
      'Merchant',
      `New Payment Received - Order #${order.id}`,
      merchantHtml,
    );
  } else {
    logger.warn('MERCHANT_EMAIL not configured, skipping merchant notification');
  }
}


  async getClientPaymentReport(trackingId: string) {
    const report = await this.prisma.payment.findUnique({
      where: { paymentReference: trackingId },
      include: {
        order: { include: { items: { include: { artwork: true } } } },
      },
    });

    if (!report) {
      throw new NotFoundException(
        `Payment for tracking ID ${trackingId} is not found!`,
      );
    }
    return report;
  }
}

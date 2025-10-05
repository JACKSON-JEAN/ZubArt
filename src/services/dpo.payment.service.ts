import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import { PrismaService } from './prisma.service';
import {
  DPOPaymentResponse,
  DPOCallbackResponse,
} from 'src/graphql/models/dbo_payment.response.model';
import { OrderStatus } from 'generated/prisma';

@Injectable()
export class DPOPaymentService {
  private readonly logger = new Logger(DPOPaymentService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** Initiates a DPO payment and returns redirect URL */
  async initiatePayment(orderId: number): Promise<DPOPaymentResponse> {
    const dpoUrl = this.config.get<string>('DPO_PAYMENT_URL');
    const companyToken = this.config.get<string>('DPO_COMPANY_TOKEN');
    const serviceType = this.config.get<string>('DPO_SERVICE_TYPE');
    const paymentPage = this.config.get<string>('DPO_PAYMENT_PAGE');
    const returnUrl = this.config.get<string>('APP_URL');

    if (
      !dpoUrl ||
      !companyToken ||
      !serviceType ||
      !paymentPage ||
      !returnUrl
    ) {
      throw new BadRequestException('Missing DPO configuration values');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) throw new BadRequestException('Order not found');

    const xmlPayload = `
      <?xml version="1.0" encoding="UTF-8"?>
      <API3G>
        <CompanyToken>${companyToken}</CompanyToken>
        <Request>createToken</Request>
        <Transaction>
          <PaymentAmount>${order.totalAmount}</PaymentAmount>
          <PaymentCurrency>${this.config.get<string>('DPO_CURRENCY') || 'UGX'}</PaymentCurrency>
          <CompanyRef>${order.id}-${Date.now()}</CompanyRef>
          <RedirectURL>${returnUrl}/payment/success</RedirectURL>
          <BackURL>${returnUrl}/payment/cancel</BackURL>
          <CompanyRefUnique>1</CompanyRefUnique>
          <CustomerEmail>${order.customer.email || 'customer@example.com'}</CustomerEmail>
          <CustomerFirstName>${order.customer.fullName?.split(' ')[0] || 'Customer'}</CustomerFirstName>
          <CustomerLastName>${order.customer.fullName?.split(' ')[1] || 'Name'}</CustomerLastName>
          <PTL>5</PTL>
        </Transaction>
        <Services>
          <Service>
            <ServiceType>${serviceType}</ServiceType>
            <ServiceDescription>Order #${order.id}</ServiceDescription>
            <ServiceDate>${new Date().toISOString().split('T')[0]}</ServiceDate>
            <ServiceAmount>${order.totalAmount}</ServiceAmount>
          </Service>
        </Services>
      </API3G>
    `;

    this.logger.debug(`Sending CreateToken XML to DPO:\n${xmlPayload}`);

    let response;
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${dpoUrl}/API/v6/`, xmlPayload, {
          headers: { 'Content-Type': 'application/xml' },
        }),
      );
      response = data;
    } catch (err) {
      this.logger.error('❌ DPO API call failed', err);
      throw new BadRequestException(
        'DPO API call failed. Check logs for details.',
      );
    }

    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    const parsed = parser.parse(response);

    this.logger.debug(`DPO Response:\n${JSON.stringify(parsed, null, 2)}`);

    // Handle nested API3G (DPO quirk)
    const apiResponse = parsed.API3G?.API3G || parsed.API3G;

    if (
      String(apiResponse?.Result) === '0' ||
      String(apiResponse?.Result) === '000'
    ) {
      const token = apiResponse.TransToken;
      return {
        orderTrackingId: order.id.toString(),
        // paymentRedirectUrl: `${paymentPage}?ID=${token}`,
        paymentRedirectUrl: `${process.env.DPO_PAYMENT_PAGE}?ID=${token}`,
      };
    }

    throw new BadRequestException(
      apiResponse?.ResultExplanation || 'Failed to create transaction',
    );
  }

  /** Handles DPO callback and updates order status */
  async handleCallback(query: any): Promise<DPOCallbackResponse> {
    this.logger.log('📞 DPO Callback received:', query);
    if (!query.TransactionToken)
      return { status: 'failed', message: 'Missing TransactionToken' };

    const verification = await this.verifyPayment(query.TransactionToken);

    const orderId = query.CompanyRef ? parseInt(query.CompanyRef, 10) : null;
    if (orderId) {
      const status =
        verification.status === 'success'
          ? OrderStatus.PAID
          : OrderStatus.FAILED;
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (status === OrderStatus.PAID) {
        await this.prisma.payment.create({
          data: {
            orderId,
            amount: order?.totalAmount || 0, // you can pass amount from verification if returned
            currency: this.config.get<string>('DPO_CURRENCY') || 'UGX',
            paymentMethod: 'CARD',
            paymentProvider: 'DPO',
            paymentReference: query.TransactionToken,
            status: 'PAID',
          },
        });
      }
    }

    return verification;
  }

  /** Public method to verify a DPO transaction */
  public async verifyPayment(
    transactionToken: string,
  ): Promise<DPOCallbackResponse> {
    if (!transactionToken)
      throw new BadRequestException('Missing TransactionToken');

    const dpoUrl = this.config.get<string>('DPO_PAYMENT_URL');
    const companyToken = this.config.get<string>('DPO_COMPANY_TOKEN');

    const xmlPayload = `
      <?xml version="1.0" encoding="UTF-8"?>
      <API3G>
        <CompanyToken>${companyToken}</CompanyToken>
        <Request>verifyToken</Request>
        <TransactionToken>${transactionToken}</TransactionToken>
      </API3G>
    `;

    this.logger.debug(`Verifying transaction with DPO:\n${xmlPayload}`);

    const { data } = await firstValueFrom(
      this.http.post(`${dpoUrl}/API/v6/`, xmlPayload, {
        headers: { 'Content-Type': 'application/xml' },
      }),
    );

    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    const parsed = parser.parse(data);

    this.logger.debug(
      `DPO Verify Response:\n${JSON.stringify(parsed, null, 2)}`,
    );

    // Handle nested API3G
    const transaction =
      parsed.API3G?.Transaction || parsed.API3G?.API3G?.Transaction || {};

    return {
      status: transaction.PaymentStatus === 'APPROVED' ? 'success' : 'failed',
      message:
        transaction.PaymentStatus === 'APPROVED'
          ? 'Payment successful'
          : transaction.ResultExplanation || 'Payment failed',
    };
  }
}

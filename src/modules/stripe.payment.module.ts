import { Module } from '@nestjs/common';
import { StripePaymentService } from 'src/services/stripe.payment.service';
import { StripePaymentController } from 'src/controllers/stripe_payment.controller';
import { PrismaService } from 'src/services/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { StripePaymentResolver } from '../resolvers/stripe_payment.resolver';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [StripePaymentService, PrismaService, StripePaymentResolver],
  controllers: [StripePaymentController]
})
export class StripePaymentModule {}

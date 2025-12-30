// import { Module } from "@nestjs/common";
// import { PrismaModule } from "./prisma.module";
// import { PaymentService } from "../services/payment.service";
// import { PaymentResolver } from "../resolvers/payment.resolver";
// import { HttpModule } from "@nestjs/axios";
// import { PaymentController } from "../controllers/payment.controller";
// import { DPOPaymentService } from "../services/dpo.payment.service";
// import { DPOPaymentResolver } from "../resolvers/dpo.payment.resolver";
// import { PesapalPaymentService } from "../services/pesapal.payment.service";
// import { PesapalPaymentResolver } from "../resolvers/pesapal.payment.resolver";
// import { DPOPaymentController } from "../controllers/dpo_payment.controller";

// @Module({
//     imports: [PrismaModule, HttpModule],
//     controllers: [PaymentController, DPOPaymentController],
//     providers: [PaymentService, PaymentResolver, DPOPaymentService, DPOPaymentResolver, PesapalPaymentService, PesapalPaymentResolver],
//     exports: [PaymentService]
// })

// export class PaymentModule {}
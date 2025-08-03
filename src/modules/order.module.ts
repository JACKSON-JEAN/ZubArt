import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { OrderService } from "../services/order.service";
import { OrderResolver } from "../resolvers/order.resolver";

@Module({
    imports: [PrismaModule],
    providers: [OrderService, OrderResolver]
})

export class OrderModule {}
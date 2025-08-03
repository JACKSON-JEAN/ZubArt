import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { OrderItemService } from "../services/order_item.service";
import { OrderItemResolver } from "../resolvers/order_item.resolver";

@Module({
    imports: [PrismaModule],
    providers: [OrderItemService, OrderItemResolver]
})

export class OrderItemModule {}
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { CartItemService } from "../services/cartItem.service";
import { CartItemResolver } from "../resolvers/cartItem.resolver";

@Module({
    imports: [PrismaModule],
    providers: [CartItemService, CartItemResolver]
})

export class CartItemModule {}
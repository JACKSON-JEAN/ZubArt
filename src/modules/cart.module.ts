import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { CartResolver } from "../resolvers/cart.resolver";
import { CartService } from "../services/cart.service";

@Module({
    imports: [PrismaModule],
    providers: [CartService, CartResolver],
})
export class CartModule {}
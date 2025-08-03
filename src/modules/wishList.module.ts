import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { WishListService } from "../services/wishList.service";
import { WishListResolver } from "../resolvers/wishList.resolver";

@Module({
    imports: [PrismaModule],
    providers: [WishListService, WishListResolver ]
})

export class WishListModule {}
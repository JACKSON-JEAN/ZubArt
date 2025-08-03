import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { ArtisanService } from "src/services/artisan.service";
import { ArtisanResolver } from "src/resolvers/artisan.resolver";

@Module({
    imports: [PrismaModule],
    providers: [ArtisanService, ArtisanResolver]
})

export class ArtisanModule {}
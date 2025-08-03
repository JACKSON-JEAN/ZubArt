import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { ArtworkService } from "src/services/artwork.service";
import { ArtworkResolver } from "src/resolvers/artwork.resolver";

@Module({
    imports: [PrismaModule],
    providers: [ArtworkService, ArtworkResolver]
})

export class ArtworkModule {}
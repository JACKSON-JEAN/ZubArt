import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { ArtworkMediaService } from "../services/artwork_media.service";
import { ArtworkMediaResolver } from "../resolvers/artwork_media.resolver";
import { CloudinaryService } from "../services/cloudinary.service";

@Module({
    imports: [PrismaModule],
    providers: [
        ArtworkMediaService, 
        ArtworkMediaResolver,
        CloudinaryService,
    ]
})

export class ArtworkMediaModule {}
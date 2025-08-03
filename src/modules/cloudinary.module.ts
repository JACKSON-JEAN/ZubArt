import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CloudinaryService } from "src/services/cloudinary.service";

@Module({
    imports: [ConfigModule],
    providers: [CloudinaryService],
    exports: [CloudinaryService]
})

export class CloudinaryModule {}
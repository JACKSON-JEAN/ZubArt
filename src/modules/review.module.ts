import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { ReviewsService } from "../services/reviews.service";
import { ReviewsResolver } from "../resolvers/reviews.resolver";

@Module({
    imports: [PrismaModule],
    providers: [ReviewsService, ReviewsResolver]
})

export class ReviewModule {}
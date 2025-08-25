import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { SubscriberService } from "../services/subscriber.service";
import { SubscriberResolver } from "src/resolvers/subscriber.resolver";

@Module({
    imports: [PrismaModule],
    providers: [SubscriberService, SubscriberResolver]
})

export class SubscriberModule {}
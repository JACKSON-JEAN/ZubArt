import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { MessagesService } from "../services/messages.service";
import { MessagesResolver } from "../resolvers/messages.resolver";

@Module({
    imports: [PrismaModule],
    providers: [MessagesService, MessagesResolver]
})

export class MessagesModule {}
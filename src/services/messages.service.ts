import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddMessageInput } from "src/graphql/input/add_message.input";
import { MessageStatus } from "generated/prisma";

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);
    constructor(
        private readonly prismaService: PrismaService
    ){}

    async sendMessage(messageInput: AddMessageInput){
        const {fullName, email, message, status} = messageInput

        if(!fullName || !email || !message) {
            throw new BadRequestException("Please enter all the required fields")
        }

        try {
            const sentMessage = await this.prismaService.message.create({
                data: {
                    fullName,
                    email,
                    message,
                    status: status || MessageStatus.Unread
                }
            })

            return sentMessage
        } catch (error) {
            this.logger.error("An error occured when sending message", error.message)
            throw new InternalServerErrorException("An error occured when sending message")
        }
    }

    async readMessages() {
        try {
            return await this.prismaService.message.findMany({
                orderBy: {
                    createdAt: "desc"
                }
            })
        } catch (error) {
            this.logger.error("An error occured when loading message", error.message)
            throw new InternalServerErrorException("An error occured when loading message")
        }
    }
}
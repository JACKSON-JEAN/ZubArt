import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AddMessageInput } from "src/graphql/input/add_message.input";
import { MessageModel } from "src/graphql/models/message.model";
import { MessagesService } from "src/services/messages.service";

@Resolver(() => MessageModel)
export class MessagesResolver {
    constructor(private readonly messagesService: MessagesService) {}

    @Mutation(() => MessageModel)
    async sendMessage(@Args("messageInput") messageInput: AddMessageInput){
        return await this.messagesService.sendMessage(messageInput)
    }

    @Query(() => [MessageModel])
    async readMessages(){
        return await this.messagesService.readMessages()
    }
}
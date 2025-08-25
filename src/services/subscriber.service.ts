import { ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddSubscriberInput } from "src/graphql/input/add__subscriber.input";
import { SubscriberStatus } from "generated/prisma";

@Injectable()
export class SubscriberService {
    constructor(private prismaService: PrismaService){}

    async getSubscribers(){
        try {
           return await this.prismaService.subscriber.findMany() 
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching subscribers.")
        }
    }

    async addSubscriber(subscriberInput: AddSubscriberInput){
        const {email, status} = subscriberInput

        const existingSubscriber = await this.prismaService.subscriber.findUnique({
            where: {email}
        })

        if(existingSubscriber){
            throw new ConflictException("Email already exists.")
        }

        try {
            const newSubscriber = await this.prismaService.subscriber.create({
                data: {
                    email,
                    status: status || SubscriberStatus.ACTIVE
                }
            })
            return newSubscriber;

        } catch (error) {
            throw new InternalServerErrorException("There was an error when adding a subscriber.")
        }
    }
}
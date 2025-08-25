import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { SubscriberModel } from "../graphql/models/subscriber.model";
import { SubscriberService } from "../services/subscriber.service";
import { AddSubscriberInput } from "../graphql/input/add__subscriber.input";

@Resolver(() => SubscriberModel)
export class SubscriberResolver {
    constructor(private subscriberService: SubscriberService) {}

    @Query(() => [SubscriberModel])
    async getSubscribers(){
        return await this.subscriberService.getSubscribers()
    }

    @Mutation(() => SubscriberModel)
    async addSubscriber(@Args("addSubscriberInput") addSubscriberInput: AddSubscriberInput) {
        return await this.subscriberService.addSubscriber(addSubscriberInput)
    }
}
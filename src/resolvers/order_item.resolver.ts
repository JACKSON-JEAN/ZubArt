import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { OrderItemModel } from "../graphql/models/orderItem.model";
import { OrderItemService } from "../services/order_item.service";
import { AddOrderItemInput } from "../graphql/input/add_orderItem.input";
import { UpdateOrderItemInput } from "../graphql/input/update_orderItem.input";

@Resolver(() => OrderItemModel)
export class OrderItemResolver{
    constructor(private orderItemService: OrderItemService) {}

    @Mutation(() => OrderItemModel)
    async addOrderItem(@Args("addOrderItemInput") addOrderItemInput: AddOrderItemInput) {
        return await this.orderItemService.addOrderItem(addOrderItemInput)
    }

    @Query(() => [OrderItemModel])
    async getOrderItems() {
        return await this.orderItemService.getOrderItems()
    }

    @Query(() => OrderItemModel)
    async getOrderItemById(@Args("orderItemId") orderItemId: number) {
        return await this.orderItemService.getOrderItemById(orderItemId)
    }

    @Mutation(() => OrderItemModel)
    async updateOrderItem(@Args("orderItemId") orderItemId: number, @Args("updateOrderItemInput") updateOrderItemInput: UpdateOrderItemInput){
        return await this.orderItemService.updateOrderItem(orderItemId, updateOrderItemInput)
    }

    @Mutation(() => String)
    async deleteOrderItem(@Args("orderItemId") orderItemId: number) {
        return await this.orderItemService.deleteOrderItem(orderItemId)
    }
}
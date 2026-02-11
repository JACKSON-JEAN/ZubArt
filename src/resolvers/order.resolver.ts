import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrderModel } from '../graphql/models/order.model';
import { OrderService } from '../services/order.service';
import { AddOrderInput } from '../graphql/input/add_order.input';
import { UpdateOrderInput } from '../graphql/input/update_order.input';
import { SearchOrdersInput } from '../graphql/input/search_orders.input';
import { Roles } from 'src/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@Resolver(() => OrderModel)
export class OrderResolver {
  constructor(private orderService: OrderService) {}

  @Mutation(() => OrderModel)
  async addOrder(
    @Args('addOrderInput') addOrderInput: AddOrderInput,
    @Args('customerId') customerId: number,
  ) {
    return await this.orderService.addOrder(addOrderInput, customerId);
  }

  @Query(() => [OrderModel])
  async getOrders(@Args('searchInput') searchInput: SearchOrdersInput) {
    return await this.orderService.getOrders(searchInput);
  }

  @Query(() => [OrderModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminOrders(@Args('searchInput') searchInput: SearchOrdersInput) {
    return await this.orderService.getOrders(searchInput);
  }

  @Query(() => OrderModel)
  async getOrderById(@Args('orderId') orderId: number) {
    return await this.orderService.getOrderId(orderId);
  }

  @Mutation(() => OrderModel)
  async updateOrder(
    @Args('orderId') orderId: number,
    @Args('updateOrderInput') updateOrderInput: UpdateOrderInput,
  ) {
    return await this.orderService.updateOrder(orderId, updateOrderInput);
  }

  @Mutation(() => String)
  async deleteOrder(@Args('orderId') orderId: number) {
    return await this.orderService.deleteOrder(orderId);
  }
}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AddOrderInput } from 'src/graphql/input/add_order.input';
import { OrderStatus } from 'generated/prisma';
import { UpdateOrderInput } from '../graphql/input/update_order.input';
import { SearchOrdersInput } from '../graphql/input/search_orders.input';

@Injectable()
export class OrderService {
  constructor(private prismaService: PrismaService) {}

  async addOrder(addOrderInput: AddOrderInput, customerId: number) {
    const { totalAmount } = addOrderInput;
    if (!totalAmount) {
        throw new BadRequestException('Total amount is required');
    }

    const cart = await this.prismaService.cart.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            artwork: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot create order.');
    }

    const cartTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    if(Math.abs(cartTotal - totalAmount) > 0.1){
        throw new BadRequestException("Order total does not match cart total");
    }

    try {
      const addedOrder = await this.prismaService.order.create({
        data: {
          customerId: customerId,
          shippingAddressId: addOrderInput.shippingAddressId || null,
          totalAmount: addOrderInput.totalAmount,
          status: addOrderInput.status || OrderStatus.PENDING,
          items: {
            create: cart.items.map((item) => ({
              artworkId: item.artworkId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      await this.prismaService.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await this.prismaService.cart.delete({
        where: { id: cart.id },
      });
      return addedOrder;
    } catch (error) {
      throw new InternalServerErrorException(
        'There was an error when adding an order',
      );
    }
  }

  async getOrders(searchInput: SearchOrdersInput) {
    const {
      customerName,
      status,
      dateFrom,
      dateTo,
      minTotal,
      maxTotal,
      city,
      country,
    } = searchInput;
    try {
      return await this.prismaService.order.findMany({
        where: {
          AND: [
            status ? { status } : {},
            dateFrom ? { createdAt: { gte: dateFrom } } : {},
            dateTo ? { createdAt: { lte: dateTo } } : {},
            minTotal ? { totalAmount: { gte: minTotal } } : {},
            maxTotal ? { totalAmount: { lte: maxTotal } } : {},
            customerName
              ? {
                  customer: {
                    fullName: { contains: customerName, mode: 'insensitive' },
                  },
                }
              : {},
          ],
        },
        include: {
          customer: true,
          shippingAddress: true,
          items: {
            include: {
              artwork: true,
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'There was an error when fetching orders',
      );
    }
  }

  async getOrderId(orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`An order with ID: ${orderId} not found`);
    }

    return order;
  }

  async updateOrder(orderId: number, updateOrderInput: UpdateOrderInput) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`An order with ID: ${orderId} not found`);
    }

    try {
      const updatedOrder = await this.prismaService.order.update({
        where: { id: orderId },
        data: updateOrderInput,
      });
      return updatedOrder;
    } catch (error) {
      throw new InternalServerErrorException(
        'There was an error when updating an order',
      );
    }
  }

  async deleteOrder(orderId: number) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`An order with ID: ${orderId} not found`);
    }

    try {
      await this.prismaService.order.delete({
        where: { id: orderId },
      });
      return 'An order deleted successfully';
    } catch (error) {
      throw new InternalServerErrorException(
        'There was an error when deleting an order',
      );
    }
  }
}

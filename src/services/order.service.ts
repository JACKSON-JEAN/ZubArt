import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddOrderInput } from "src/graphql/input/add_order.input";
import { OrderStatus } from "generated/prisma";
import { UpdateOrderInput } from "../graphql/input/update_order.input";
import { SearchOrdersInput } from "../graphql/input/search_orders.input";

@Injectable()
export class OrderService {
    constructor(private prismaService: PrismaService) {}

    async addOrder(addOrderInput: AddOrderInput) {
        const {customerId, totalAmount} = addOrderInput
        if(!customerId || !totalAmount) {
            throw new BadRequestException("Please fill all the neccessary fields")
        }

        try {
            const addedOrder = await this.prismaService.order.create({
                data: {
                    customerId: addOrderInput.customerId,
                    shippingAddressId: addOrderInput.shippingAddressId || null,
                    totalAmount: addOrderInput.totalAmount,
                    status: addOrderInput.status || OrderStatus.PENDING
                }
            })
            return addedOrder
            
        } catch (error) {
            throw new InternalServerErrorException("There was an error when adding an order")
        }
    }

    async getOrders(searchInput: SearchOrdersInput) {
        const {customerName, status, dateFrom, dateTo, minTotal, maxTotal, city, country} = searchInput
        try {
            return await this.prismaService.order.findMany({
                where: {
                    AND: [
                        status ? {status} : {},
                        dateFrom ? {createdAt: {gte: dateFrom}} : {},
                        dateTo ? {createdAt: {lte: dateTo}} : {},
                        minTotal ? {totalAmount: {gte: minTotal}} : {},
                        maxTotal ? {totalAmount: {lte: maxTotal}} : {},
                        customerName ? {
                            customer: {fullName: {contains: customerName, mode: 'insensitive'}}
                        } : {},
                    ]
                },
                include: {
                    customer: true,
                    shippingAddress: true
                }
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching orders")
        }
    }

    async getOrderId(orderId: number) {
        const order = await this.prismaService.order.findUnique({
            where: {id: orderId},
            include: {
                customer: true,
                shippingAddress: true
            }
        })

        if(!order) {
            throw new NotFoundException(`An order with ID: ${orderId} not found`)
        }

        return order
    }

    async updateOrder(orderId: number, updateOrderInput: UpdateOrderInput) {
        const order = await this.prismaService.order.findUnique({
            where: {id: orderId}
        })
        if(!order) {
            throw new NotFoundException(`An order with ID: ${orderId} not found`)
        }

        try {
            const updatedOrder = await this.prismaService.order.update({
                where: {id: orderId},
                data: updateOrderInput
            })
            return updatedOrder

        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating an order")
        }
    }

    async deleteOrder(orderId: number) {
        const order = await this.prismaService.order.findUnique({
            where: {id: orderId}
        })
        if(!order) {
            throw new NotFoundException(`An order with ID: ${orderId} not found`)
        }

        try {
            await this.prismaService.order.delete({
                where: {id: orderId}
            })
            return "An order deleted successfully"

        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting an order")
        }
    }
}
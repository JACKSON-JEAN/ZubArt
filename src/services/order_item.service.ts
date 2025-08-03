import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddOrderItemInput } from "../graphql/input/add_orderItem.input";
import { UpdateOrderItemInput } from "../graphql/input/update_orderItem.input";

@Injectable()
export class OrderItemService{
    constructor(private prismaService: PrismaService) {}

    async addOrderItem(addOrderItemInput: AddOrderItemInput) {
        const {artworkId, quantity, orderId, price} = addOrderItemInput
        if(!artworkId || !quantity || !orderId || !price) {
            throw new BadRequestException("Please fill all the neccessary fields")
        }

        try {
            const addedOrderItem = await this.prismaService.orderItem.create({
                data: {
                    artworkId: addOrderItemInput.artworkId,
                    quantity: addOrderItemInput.quantity,
                    orderId: addOrderItemInput.orderId,
                    price: addOrderItemInput.price
                }
            })
            return addedOrderItem
        } catch (error) {
            throw new InternalServerErrorException("There was an error when adding an order item")
        }
    }

    async getOrderItems() {
        try {
            return await this.prismaService.orderItem.findMany({
                include: {
                    artwork: true,
                    order: true
                }
            })
        } catch (error) {
            throw new InternalServerErrorException("There was an error when fetching orderItems")
        }
    }

    async getOrderItemById(orderItemId: number) {
        const orderItem = await this.prismaService.orderItem.findUnique({
            where: {id: orderItemId},
            include: {
                artwork: true,
                order: true
            }
        })

        if(!orderItem){
            throw new NotFoundException(`An orderItem with ID: ${orderItemId} not found`)
        }

        return orderItem
    }

    async updateOrderItem(orderItemId: number, updateOrderItemInput: UpdateOrderItemInput) {
        const orderItem = await this.prismaService.orderItem.findUnique({
            where: {id: orderItemId}
        })

        if(!orderItem){
            throw new NotFoundException(`An orderItem with ID: ${orderItemId} not found`)
        }

        try {
            const updatedOrderItem = await this.prismaService.orderItem.update({
                where: {id: orderItemId},
                data: updateOrderItemInput
            })
            return updatedOrderItem

        } catch (error) {
            throw new InternalServerErrorException("There was an error when updating an orderItem")
        }
    }

    async deleteOrderItem(orderItemId: number) {
        const orderItem = await this.prismaService.orderItem.findUnique({
            where: {id: orderItemId}
        })

        if(!orderItem){
            throw new NotFoundException(`An orderItem with ID: ${orderItemId} not found`)
        }

        try {
            await this.prismaService.orderItem.delete({ where: {id: orderItemId}})
            return "An orderItem was deleted successfully"

        } catch (error) {
            throw new InternalServerErrorException("There was an error when deleting an orderItem")
        }
    }
}
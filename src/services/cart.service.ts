import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Injectable()
export class CartService {
    constructor(private prismaService: PrismaService) {}

    async getCarts() {
        try {
            return await this.prismaService.cart.findMany({
                include: {
                    customer: true,
                    items: {
                        include: {artwork: true}
                    }
                }
            })
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when fetching carts!")
        }
    }

    async getClientCart(clientId: number) {
        try {
            const cart = await this.prismaService.cart.findFirst({
                where: {customerId: clientId},
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    customer: true,
                    items: {
                        include: {artwork: true},
                        orderBy: {
                            id: "desc"
                        }
                    }
                }
            })

            if(!cart) {
                return null;
            }
    
            return cart
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when fetching the client's cart!")
        }
    }
}
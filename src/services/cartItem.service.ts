import {
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
  } from "@nestjs/common";
  import { PrismaService } from "./prisma.service";
  import { AddCartItemInput } from "../graphql/input/add_cartItem.input";
  
  @Injectable()
  export class CartItemService {
    constructor(private prisma: PrismaService) {}
  
    async addCartItem(addItemInput: AddCartItemInput, clientId: number) {
      const { artworkId, quantity, price } = addItemInput;
  
      let cart = await this.prisma.cart.findFirst({
        where: { customerId: clientId },
      });
  
      if (!cart) {
        try {
          cart = await this.prisma.cart.create({
            data: {
              customerId: clientId,
              totalAmount: price * quantity,
            },
          });
        } catch (error) {
          throw new InternalServerErrorException("Failed to create cart.");
        }
      }
  
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          artworkId,
        },
      });
  
      try {
        if (existingItem) {
          const updatedItem = await this.prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: { increment: quantity },
              price,
            },
          });
  
          await this.updateCartTotal(cart.id);
          return updatedItem;
        } else {
          const newItem = await this.prisma.cartItem.create({
            data: {
              cartId: cart.id,
              artworkId,
              quantity,
              price,
            },
          });
  
          await this.updateCartTotal(cart.id);
          return newItem;
        }
      } catch (error) {
        throw new InternalServerErrorException("Failed to add/update cart item.");
      }
    }
  
    async cartItemIncrement(itemId: number, clientId: number) {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });
  
      if (!cartItem || cartItem.cart.customerId !== clientId) {
        throw new UnauthorizedException("You do not have permission to modify this item.");
      }
  
      try {
        const updatedItem = await this.prisma.cartItem.update({
          where: { id: itemId },
          data: {
            quantity: { increment: 1 },
          },
        });
  
        await this.updateCartTotal(cartItem.cartId);
        return updatedItem;
      } catch (error) {
        throw new InternalServerErrorException("Failed to increase cart item quantity.");
      }
    }
  
    async cartItemDecrement(itemId: number, clientId: number) {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });
  
      if (!cartItem || cartItem.cart.customerId !== clientId) {
        throw new UnauthorizedException("You do not have permission to modify this item.");
      }
  
      const cartId = cartItem.cartId;
  
      if (cartItem.quantity > 1) {
        try {
          const updatedItem = await this.prisma.cartItem.update({
            where: { id: itemId },
            data: {
              quantity: { decrement: 1 },
            },
          });
  
          await this.updateCartTotal(cartId);
          return updatedItem;
        } catch (error) {
          throw new InternalServerErrorException("Failed to decrease cart item quantity.");
        }
      }
  
      // Quantity is 1 — delete the item
      try {
        const deletedItem = await this.prisma.cartItem.delete({
          where: { id: itemId },
        });
  
        const remainingItems = await this.prisma.cartItem.findMany({
          where: { cartId },
        });
  
        if (remainingItems.length === 0) {
          await this.prisma.cart.delete({
            where: { id: cartId },
          });
        } else {
          await this.updateCartTotal(cartId);
        }
  
        return deletedItem;
      } catch (error) {
        throw new InternalServerErrorException("Failed to delete cart item.");
      }
    }
  
    async deleteCartItem(itemId: number, clientId: number) {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });
  
      if (!cartItem || cartItem.cart.customerId !== clientId) {
        throw new UnauthorizedException("You do not have permission to delete this item.");
      }
  
      const cartId = cartItem.cartId;
  
      try {
        await this.prisma.cartItem.delete({
          where: { id: itemId },
        });
  
        const remainingItems = await this.prisma.cartItem.findMany({
          where: { cartId },
        });
  
        if (remainingItems.length === 0) {
          await this.prisma.cart.delete({
            where: { id: cartId },
          });
        } else {
          await this.updateCartTotal(cartId);
        }
  
        return "Item deleted successfully.";
      } catch (error) {
        throw new InternalServerErrorException("Failed to delete cart item.");
      }
    }
  
    async getCartItems(clientId: number) {
      const cart = await this.prisma.cart.findFirst({
        where: { customerId: clientId },
      });
  
      if (!cart) return [];
  
      try {
        const cartItems = await this.prisma.cartItem.findMany({
          where: { cartId: cart.id },
          include: {
            artwork: true,
          },
        });
  
        return cartItems;
      } catch (error) {
        throw new InternalServerErrorException("Failed to fetch cart items.");
      }
    }
  
    private async updateCartTotal(cartId: number) {
      const items = await this.prisma.cartItem.findMany({
        where: { cartId },
      });
  
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
  
      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          totalAmount: total,
        },
      });
    }
  }
  
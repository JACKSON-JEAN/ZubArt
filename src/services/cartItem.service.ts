import {
  BadRequestException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
  } from "@nestjs/common";
  import { PrismaService } from "./prisma.service";
  import { AddCartItemInput } from "../graphql/input/add_cartItem.input";
  
  @Injectable()
  export class CartItemService {
    constructor(private prisma: PrismaService) {}
  
    // async addCartItem(addItemInput: AddCartItemInput, clientId: number) {
    //   const { artworkId, quantity, price } = addItemInput;

    //   const artwork = await this.prisma.artwork.findUnique({
    //     where: { id: artworkId },
    //   });

    //   if (!artwork?.isAvailable) {
    //     throw new BadRequestException('This artwork is no longer available');
    //   }

    //   // await this.prisma.artwork.update({
    //   //   where: { id: artworkId },
    //   //   data: { 
    //   //     reservedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    //   //     isAvailable: false
    //   //   }
    //   // });
  
    //   let cart = await this.prisma.cart.findFirst({
    //     where: { customerId: clientId },
    //   });
  
    //   if (!cart) {
    //     try {
    //       cart = await this.prisma.cart.create({
    //         data: {
    //           customerId: clientId,
    //           totalAmount: price * quantity,
    //         },
    //       });
    //     } catch (error) {
    //       throw new InternalServerErrorException("Failed to create cart.");
    //     }
    //   }
  
    //   const existingItem = await this.prisma.cartItem.findFirst({
    //     where: {
    //       cartId: cart.id,
    //       artworkId,
    //     },
    //   });
  
    //   try {
    //     if (existingItem) {
    //       const updatedItem = await this.prisma.cartItem.update({
    //         where: { id: existingItem.id },
    //         data: {
    //           quantity: { increment: quantity },
    //           price,
    //         },
    //       });
  
    //       await this.updateCartTotal(cart.id);
    //       return updatedItem;
    //     } else {
    //       const newItem = await this.prisma.cartItem.create({
    //         data: {
    //           cartId: cart.id,
    //           artworkId,
    //           quantity,
    //           price,
    //         },
    //       });
  
    //       await this.updateCartTotal(cart.id);
    //       return newItem;
    //     }
    //   } catch (error) {
    //     throw new InternalServerErrorException("Failed to add/update cart item.");
    //   }
    // }

    async addCartItem(addItemInput: AddCartItemInput, clientId: number) {
  const { artworkId, quantity, price } = addItemInput;

  const artwork = await this.prisma.artwork.findUnique({
    where: { id: artworkId },
  });

  if (!artwork?.isAvailable) {
    throw new BadRequestException('This artwork is no longer available');
  }

  return this.prisma.$transaction(async (tx) => {
    let cart = await tx.cart.findFirst({
      where: { customerId: clientId },
    });

    if (!cart) {
      cart = await tx.cart.create({
        data: {
          customerId: clientId,
          totalAmount: 0,
        },
      });
    }

    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        artworkId,
      },
    });

    let result;

    if (existingItem) {
      result = await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: { increment: quantity },
          price,
        },
      });
    } else {
      result = await tx.cartItem.create({
        data: {
          cartId: cart.id,
          artworkId,
          quantity,
          price,
        },
      });
    }

    const items = await tx.cartItem.findMany({
      where: { cartId: cart.id },
    });

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    await tx.cart.update({
      where: { id: cart.id },
      data: { totalAmount: total },
    });

    return result;
  });
}

  
    async cartItemIncrement(itemId: number, clientId: number) {
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true, artwork: true },
      });
  
      if (!cartItem || cartItem.cart.customerId !== clientId) {
        throw new UnauthorizedException("You do not have permission to modify this item.");
      }

      if (!cartItem.artwork.isAvailable) {
        throw new BadRequestException('This artwork is no longer available');
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
        include: { cart: true, artwork: true },
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

        // await this.prisma.artwork.update({
        //   where: { id: cartItem.artworkId },
        //   data: {
        //     isAvailable: true,
        //     reservedUntil: null
        //   }
        // });
  
        const remainingItems = await this.prisma.cartItem.findMany({
          where: { cartId },
        });
  
        if (remainingItems.length === 0) {
          await this.prisma.cart.update({
            where: {id: cartId},
            data: {totalAmount: 0}
          })
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

        // await this.prisma.artwork.update({
        //   where: { id: cartItem.artworkId },
        //   data: {
        //     isAvailable: true,
        //     reservedUntil: null
        //   }
        // });
  
        const remainingItems = await this.prisma.cartItem.findMany({
          where: { cartId },
        });
  
        if (remainingItems.length === 0) {
          await this.prisma.cart.update({
            where: {id: cartId},
            data: {totalAmount: 0}
          })
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
  
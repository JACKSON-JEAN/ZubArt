import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AddAddressInput } from "../graphql/input/add_address.input";
import { UpdateAddressInput } from "../graphql/input/update_address.input";

@Injectable()
export class AddressService {
    constructor(private prismaService: PrismaService) {}

    async addAddress(addAddressInput: AddAddressInput) {
        const {fullName, phone, line1, city, country, customerId} = addAddressInput
        if(!fullName || !phone || !line1 || !city || !country) {
            throw new BadRequestException("Please fill all the necessary fields")
        }

        const customer = await this.prismaService.user.findUnique({
            where: {id: customerId}
        })

        if(!customer){
            throw new NotFoundException(`Client with ID: ${customerId} not found!`)
        }

        try {
            const addedAddress = await this.prismaService.address.create({
                data: {
                    fullName: addAddressInput.fullName,
                    phone: addAddressInput.phone,
                    email: addAddressInput.email || null,
                    line1: addAddressInput.line1,
                    line2: addAddressInput.line2 || null,
                    city: addAddressInput.city,
                    state: addAddressInput.state || null,
                    country: addAddressInput.country,
                    postalCode: addAddressInput.postalCode || null,
                    isDefault: addAddressInput.isDefault || false,
                    userId: addAddressInput.customerId || null
                }
            })
            return addedAddress

        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when adding an address")
        }
    }

    async getAddressesByCustomerId(customerId: number){
        const customer = await this.prismaService.user.findUnique({
            where: {id: customerId},
            include: {address: {
                orderBy: {
                    id: "desc"
                }
            }},
        })

        if(!customer){
            throw new NotFoundException(`No user with ID: ${customerId} found!`)
        }

        return customer.address
    }

    async getAddresses() {
        try {
            return await this.prismaService.address.findMany({
                include: {
                    user: true,
                    orders: true
                }
            })
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when fetching addresses")
        }
    }

    async getAddressById(addressId: number) {
        const address = await this.prismaService.address.findUnique({
            where: {id: addressId},
            include: {
                user: true,
                orders: true
            }
        })

        if(!address){
            throw new NotFoundException(`An address with ID: ${addressId} not found`)
        }
        return address
    }

    async updateAddress(addressId: number, updateAddressInput: UpdateAddressInput) {
        const address = await this.prismaService.address.findUnique({
            where: {id: addressId}
        })

        if(!address){
            throw new NotFoundException(`An address with ID: ${addressId} not found`)
        }

        try {
            const updatedAddress = await this.prismaService.address.update({
                where: {id: addressId},
                data: updateAddressInput
            })
            return updatedAddress

        } catch (error) {
            console.error(error)
           throw new InternalServerErrorException("There was an error when updating address") 
        }
    }

    async deleteAddress(addressId: number) {
        const address = await this.prismaService.address.findUnique({
            where: {id: addressId}
        })

        if(!address){
            throw new NotFoundException(`An address with ID: ${addressId} not found`)
        }

        try {
            await this.prismaService.address.delete({
                where: {id: addressId}
            })
            return "Address deleted successfully"
            
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("There was an error when deleting address")
        }
    }
}
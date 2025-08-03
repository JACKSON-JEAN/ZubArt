import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AddressModel } from "../graphql/models/address.model";
import { AddAddressInput } from "../graphql/input/add_address.input";
import { UpdateAddressInput } from "../graphql/input/update_address.input";
import { AddressService } from "../services/address.service";

@Resolver(() => AddressModel)
export class AddressResolver {
    constructor(private addressService: AddressService) {}

    @Mutation(() => AddressModel)
    async addAddress(@Args("addAddressInput") addAddressInput: AddAddressInput) {
        return await this.addressService.addAddress(addAddressInput)
    }

    @Query(() => [AddressModel])
    async getAddresses() {
        return await this.addressService.getAddresses()
    }

    @Query(() => AddressModel)
    async getAddressById(@Args("addressId") addressId: number) {
        return await this.addressService.getAddressById(addressId)
    }

    @Mutation(() => AddressModel)
    async updateAddress(@Args("addressId") addressId: number, @Args("updateAddressInput") updateAddressInput: UpdateAddressInput) {
        return await this.addressService.updateAddress(addressId, updateAddressInput)
    }

    @Mutation(() => String)
    async deleteAddress(@Args("addressId") addressId: number) {
        return await this.addressService.deleteAddress(addressId)
    }
}
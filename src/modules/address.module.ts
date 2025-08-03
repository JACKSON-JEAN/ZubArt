import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { AddressService } from "../services/address.service";
import { AddressResolver } from "../resolvers/address.resolver";

@Module({
    imports: [PrismaModule],
    providers: [AddressService, AddressResolver]
})

export class AddressModule {}
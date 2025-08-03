import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { UsersService } from "../services/users.service";
import { UsersResolver } from "../resolvers/users.resolver";

@Module({
    imports: [PrismaModule],
    providers: [UsersService, UsersResolver]
})

export class UsersModule {}
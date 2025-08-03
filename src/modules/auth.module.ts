import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { AuthService } from "../services/auth.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthResolver } from "../resolvers/auth.resolver";

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        PassportModule.register({defaultStrategy: "jwt"}),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>("JWT_SECRET"),
                signOptions: {
                    expiresIn: configService.get<string>("JWT_EXPIRY_DATE")
                }
            }),
            inject: [ConfigService]
        })
    ],
    providers: [AuthService, AuthResolver],
    exports: [JwtModule]
})

export class AuthModule {}
import { Module } from "@nestjs/common";
import { InventoryService } from "src/services/inventory.service";
import { PrismaModule } from "./prisma.module";

@Module({
    imports: [PrismaModule],
    providers: [InventoryService],
    exports: [InventoryService]
})

export class InventoryModule {}

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shippingAddressId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "shippingAddressId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

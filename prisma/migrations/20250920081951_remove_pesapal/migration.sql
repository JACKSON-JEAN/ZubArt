/*
  Warnings:

  - You are about to drop the column `pesapalMerchantReference` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `pesapalTrackingId` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "pesapalMerchantReference",
DROP COLUMN "pesapalTrackingId";

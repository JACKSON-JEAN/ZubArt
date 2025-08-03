/*
  Warnings:

  - Made the column `cartId` on table `CartItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "cartId" SET NOT NULL;

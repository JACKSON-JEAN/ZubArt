-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "customerId" DROP NOT NULL;

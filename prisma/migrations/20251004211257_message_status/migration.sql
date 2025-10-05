-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('Read', 'Unread');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'Unread';

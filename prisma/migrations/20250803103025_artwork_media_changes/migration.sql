/*
  Warnings:

  - You are about to alter the column `url` on the `ArtworkMedia` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(2048)`.
  - Added the required column `publicId` to the `ArtworkMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ArtworkMedia" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "publicId" TEXT NOT NULL,
ADD COLUMN     "width" INTEGER,
ALTER COLUMN "url" SET DATA TYPE VARCHAR(2048);

-- CreateIndex
CREATE INDEX "ArtworkMedia_artworkId_idx" ON "ArtworkMedia"("artworkId");

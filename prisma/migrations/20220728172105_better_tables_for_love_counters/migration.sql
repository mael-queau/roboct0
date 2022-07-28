/*
  Warnings:

  - You are about to drop the column `channelId` on the `LoveCounter` table. All the data in the column will be lost.
  - You are about to drop the column `counter` on the `LoveCounter` table. All the data in the column will be lost.
  - You are about to drop the `MiscLoveCounter` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `LoveCounter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "LoveCounter" DROP CONSTRAINT "LoveCounter_channelId_fkey";

-- DropForeignKey
ALTER TABLE "MiscLoveCounter" DROP CONSTRAINT "MiscLoveCounter_loveCounterId_fkey";

-- DropIndex
DROP INDEX "LoveCounter_userId_channelId_key";

-- AlterTable
ALTER TABLE "LoveCounter" DROP COLUMN "channelId",
DROP COLUMN "counter",
ADD COLUMN     "miscellaneousCounter" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "MiscLoveCounter";

-- CreateTable
CREATE TABLE "ChannelLoveCounter" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChannelLoveCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelLoveCounter_parentId_key" ON "ChannelLoveCounter"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelLoveCounter_channelId_key" ON "ChannelLoveCounter"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelLoveCounter_parentId_channelId_key" ON "ChannelLoveCounter"("parentId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "LoveCounter_userId_key" ON "LoveCounter"("userId");

-- AddForeignKey
ALTER TABLE "ChannelLoveCounter" ADD CONSTRAINT "ChannelLoveCounter_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LoveCounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelLoveCounter" ADD CONSTRAINT "ChannelLoveCounter_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

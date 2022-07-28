/*
  Warnings:

  - You are about to drop the column `parentId` on the `ChannelLoveCounter` table. All the data in the column will be lost.
  - You are about to drop the `LoveCounter` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ChannelLoveCounter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,channelId]` on the table `ChannelLoveCounter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `ChannelLoveCounter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChannelLoveCounter" DROP CONSTRAINT "ChannelLoveCounter_parentId_fkey";

-- DropForeignKey
ALTER TABLE "LoveCounter" DROP CONSTRAINT "LoveCounter_userId_fkey";

-- DropIndex
DROP INDEX "ChannelLoveCounter_parentId_channelId_key";

-- DropIndex
DROP INDEX "ChannelLoveCounter_parentId_key";

-- AlterTable
ALTER TABLE "ChannelLoveCounter" DROP COLUMN "parentId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "miscellaneousLoveCounter" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "LoveCounter";

-- CreateIndex
CREATE UNIQUE INDEX "ChannelLoveCounter_userId_key" ON "ChannelLoveCounter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelLoveCounter_userId_channelId_key" ON "ChannelLoveCounter"("userId", "channelId");

-- AddForeignKey
ALTER TABLE "ChannelLoveCounter" ADD CONSTRAINT "ChannelLoveCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("twitchId") ON DELETE CASCADE ON UPDATE CASCADE;

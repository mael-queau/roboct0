/*
  Warnings:

  - You are about to drop the column `channelId` on the `BotTextChannel` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[guildId,textChannelId]` on the table `BotTextChannel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `textChannelId` to the `BotTextChannel` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BotTextChannel_guildId_channelId_key";

-- AlterTable
ALTER TABLE "BotTextChannel" DROP COLUMN "channelId",
ADD COLUMN     "textChannelId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BotTextChannel_guildId_textChannelId_key" ON "BotTextChannel"("guildId", "textChannelId");

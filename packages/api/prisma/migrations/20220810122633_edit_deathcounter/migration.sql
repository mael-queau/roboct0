/*
  Warnings:

  - A unique constraint covering the columns `[channelId,gameId]` on the table `DeathCounter` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DeathCounter" ADD COLUMN     "counter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDeath" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "DeathCounter_channelId_gameId_key" ON "DeathCounter"("channelId", "gameId");

/*
  Warnings:

  - You are about to drop the column `stateId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_stateId_fkey";

-- DropIndex
DROP INDEX "User_stateId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "stateId";

-- CreateTable
CREATE TABLE "PendingAccountLink" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "PendingAccountLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingAccountLink_stateId_key" ON "PendingAccountLink"("stateId");

-- AddForeignKey
ALTER TABLE "PendingAccountLink" ADD CONSTRAINT "PendingAccountLink_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

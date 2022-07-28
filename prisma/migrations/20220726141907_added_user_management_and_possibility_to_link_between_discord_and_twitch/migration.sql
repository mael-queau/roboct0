/*
  Warnings:

  - The primary key for the `State` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[value]` on the table `State` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "State" DROP CONSTRAINT "State_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "State_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "twitchId" TEXT NOT NULL,
    "discordId" TEXT,
    "stateId" INTEGER,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stateId_key" ON "User"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitchId_key" ON "User"("twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "State_value_key" ON "State"("value");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

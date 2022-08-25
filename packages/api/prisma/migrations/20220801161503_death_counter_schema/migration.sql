-- AlterTable
ALTER TABLE "User" ALTER COLUMN "miscellaneousLoveCounter" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "DeathCounter" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "DeathCounter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeathCounter" ADD CONSTRAINT "DeathCounter_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

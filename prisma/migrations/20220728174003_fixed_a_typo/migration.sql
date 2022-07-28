-- DropForeignKey
ALTER TABLE "ChannelLoveCounter" DROP CONSTRAINT "ChannelLoveCounter_channelId_fkey";

-- DropForeignKey
ALTER TABLE "LoveCounter" DROP CONSTRAINT "LoveCounter_userId_fkey";

-- AlterTable
ALTER TABLE "ChannelLoveCounter" ALTER COLUMN "channelId" SET DATA TYPE TEXT,
ALTER COLUMN "counter" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "LoveCounter" ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "miscellaneousCounter" SET DEFAULT 1;

-- AddForeignKey
ALTER TABLE "ChannelLoveCounter" ADD CONSTRAINT "ChannelLoveCounter_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("channelId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoveCounter" ADD CONSTRAINT "LoveCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("twitchId") ON DELETE RESTRICT ON UPDATE CASCADE;

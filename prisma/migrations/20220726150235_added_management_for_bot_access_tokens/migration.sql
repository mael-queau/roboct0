-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TWITCH', 'DISCORD');

-- CreateTable
CREATE TABLE "BotToken" (
    "platform" "Platform" NOT NULL,
    "accessToken" TEXT NOT NULL,

    CONSTRAINT "BotToken_pkey" PRIMARY KEY ("platform")
);

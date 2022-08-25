-- CreateTable
CREATE TABLE "LoveCounter" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LoveCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoveCounter_userId_channelId_key" ON "LoveCounter"("userId", "channelId");

-- AddForeignKey
ALTER TABLE "LoveCounter" ADD CONSTRAINT "LoveCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoveCounter" ADD CONSTRAINT "LoveCounter_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("channelId") ON DELETE RESTRICT ON UPDATE CASCADE;

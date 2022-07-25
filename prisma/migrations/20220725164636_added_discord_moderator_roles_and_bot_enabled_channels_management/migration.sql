-- CreateTable
CREATE TABLE "ModRole" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "ModRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotTextChannel" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "BotTextChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModRole_guildId_roleId_key" ON "ModRole"("guildId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "BotTextChannel_guildId_channelId_key" ON "BotTextChannel"("guildId", "channelId");

-- AddForeignKey
ALTER TABLE "ModRole" ADD CONSTRAINT "ModRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotTextChannel" ADD CONSTRAINT "BotTextChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

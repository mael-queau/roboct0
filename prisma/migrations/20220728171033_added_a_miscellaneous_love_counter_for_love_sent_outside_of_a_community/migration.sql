-- CreateTable
CREATE TABLE "MiscLoveCounter" (
    "id" SERIAL NOT NULL,
    "loveCounterId" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MiscLoveCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MiscLoveCounter_loveCounterId_key" ON "MiscLoveCounter"("loveCounterId");

-- AddForeignKey
ALTER TABLE "MiscLoveCounter" ADD CONSTRAINT "MiscLoveCounter_loveCounterId_fkey" FOREIGN KEY ("loveCounterId") REFERENCES "LoveCounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

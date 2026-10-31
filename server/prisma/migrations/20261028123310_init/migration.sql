-- CreateTable
CREATE TABLE "Character" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL DEFAULT 0.03,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "timeMs" INTEGER,
    "playerName" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Found" (
    "gameId" TEXT NOT NULL,
    "characterId" INTEGER NOT NULL,

    CONSTRAINT "Found_pkey" PRIMARY KEY ("gameId","characterId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");

-- AddForeignKey
ALTER TABLE "Found" ADD CONSTRAINT "Found_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Found" ADD CONSTRAINT "Found_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TrackedPlayer" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "premierRating" INTEGER,
    "competitiveRank" INTEGER,
    "wins" INTEGER,
    "vacBanned" BOOLEAN NOT NULL DEFAULT false,
    "numberOfVacBans" INTEGER NOT NULL DEFAULT 0,
    "daysSinceLastBan" INTEGER,
    "numberOfGameBans" INTEGER NOT NULL DEFAULT 0,
    "communityBanned" BOOLEAN NOT NULL DEFAULT false,
    "profileCheckedAt" TIMESTAMP(3),
    "banCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanWave" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedBans" INTEGER,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BanWave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalTracked" INTEGER NOT NULL,
    "totalVacBanned" INTEGER NOT NULL,
    "totalGameBanned" INTEGER NOT NULL,
    "newBansToday" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BanSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedPlayer_steamId_key" ON "TrackedPlayer"("steamId");
CREATE INDEX "TrackedPlayer_premierRating_idx" ON "TrackedPlayer"("premierRating");
CREATE INDEX "TrackedPlayer_vacBanned_idx" ON "TrackedPlayer"("vacBanned");
CREATE INDEX "TrackedPlayer_steamId_idx" ON "TrackedPlayer"("steamId");

CREATE INDEX "BanWave_date_idx" ON "BanWave"("date");

CREATE UNIQUE INDEX "BanSnapshot_date_key" ON "BanSnapshot"("date");
CREATE INDEX "BanSnapshot_date_idx" ON "BanSnapshot"("date");

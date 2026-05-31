-- CreateTable
CREATE TABLE "GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "day" INTEGER NOT NULL DEFAULT 1,
    "lastWeekDay" INTEGER NOT NULL DEFAULT 1,
    "lastMonthDay" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "leagueLevel" INTEGER NOT NULL DEFAULT 1,
    "leaguePoints" INTEGER NOT NULL DEFAULT 0,
    "lastOfficialDay" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MonsterSpecies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'tech',
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT NOT NULL DEFAULT '🐲',
    "power" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "evasion" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "MonsterCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "energy" INTEGER NOT NULL DEFAULT 3,
    "fatigue" INTEGER NOT NULL DEFAULT 0,
    "bonusPower" INTEGER NOT NULL DEFAULT 0,
    "bonusDefense" INTEGER NOT NULL DEFAULT 0,
    "bonusSpeed" INTEGER NOT NULL DEFAULT 0,
    "bonusEvasion" INTEGER NOT NULL DEFAULT 0,
    "bonusIntelligence" INTEGER NOT NULL DEFAULT 0,
    "bonusAccuracy" INTEGER NOT NULL DEFAULT 0,
    "tempPower" INTEGER NOT NULL DEFAULT 0,
    "tempDefense" INTEGER NOT NULL DEFAULT 0,
    "tempSpeed" INTEGER NOT NULL DEFAULT 0,
    "tempEvasion" INTEGER NOT NULL DEFAULT 0,
    "tempIntelligence" INTEGER NOT NULL DEFAULT 0,
    "tempAccuracy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonsterCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MonsterCard_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "MonsterSpecies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResourceType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "price" INTEGER NOT NULL DEFAULT 50
);

-- CreateTable
CREATE TABLE "ResourceStack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ResourceStack_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResourceStack_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FusionRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromSpeciesId" TEXT NOT NULL,
    "optionIndex" INTEGER NOT NULL,
    "resultSpeciesId" TEXT,
    "isRandom" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FusionRecipe_fromSpeciesId_fkey" FOREIGN KEY ("fromSpeciesId") REFERENCES "MonsterSpecies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FusionRecipe_resultSpeciesId_fkey" FOREIGN KEY ("resultSpeciesId") REFERENCES "MonsterSpecies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FusionCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "resourceTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "FusionCost_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "FusionRecipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FusionCost_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShopMonsterOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "speciesId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ShopMonsterOffer_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "MonsterSpecies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "scoreSelf" INTEGER NOT NULL,
    "scoreOpp" INTEGER NOT NULL,
    "rewardGold" INTEGER NOT NULL DEFAULT 0,
    "rewardJson" TEXT NOT NULL DEFAULT '[]',
    "log" TEXT NOT NULL DEFAULT '[]',
    "day" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Battle_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MonsterSpecies_key_key" ON "MonsterSpecies"("key");

-- CreateIndex
CREATE INDEX "MonsterCard_ownerId_idx" ON "MonsterCard"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceType_key_key" ON "ResourceType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceStack_playerId_resourceTypeId_key" ON "ResourceStack"("playerId", "resourceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "FusionRecipe_fromSpeciesId_optionIndex_key" ON "FusionRecipe"("fromSpeciesId", "optionIndex");

-- CreateIndex
CREATE INDEX "Battle_playerId_idx" ON "Battle"("playerId");

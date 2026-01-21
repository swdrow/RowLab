-- CreateTable
CREATE TABLE "regattas" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "courseType" TEXT,
    "conditions" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regattas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "regattaId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "boatClass" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL DEFAULT 2000,
    "isHeadRace" BOOLEAN NOT NULL DEFAULT false,
    "scheduledTime" TIMESTAMP(3),

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_results" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "isOwnTeam" BOOLEAN NOT NULL DEFAULT false,
    "lineupId" TEXT,
    "finishTimeSeconds" DECIMAL(10,2),
    "place" INTEGER,
    "marginBackSeconds" DECIMAL(8,2),
    "rawSpeed" DECIMAL(6,4),
    "adjustedSpeed" DECIMAL(6,4),

    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conference" TEXT,
    "division" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_speed_estimates" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "boatClass" TEXT NOT NULL,
    "season" TEXT,
    "rawSpeed" DECIMAL(6,4),
    "adjustedSpeed" DECIMAL(6,4),
    "confidenceScore" DECIMAL(4,3),
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_speed_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regattas_teamId_idx" ON "regattas"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "external_teams_name_key" ON "external_teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_speed_estimates_teamId_boatClass_season_key" ON "team_speed_estimates"("teamId", "boatClass", "season");

-- AddForeignKey
ALTER TABLE "regattas" ADD CONSTRAINT "regattas_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_regattaId_fkey" FOREIGN KEY ("regattaId") REFERENCES "regattas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "lineups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_speed_estimates" ADD CONSTRAINT "team_speed_estimates_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

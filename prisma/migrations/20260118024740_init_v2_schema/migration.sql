-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "inviteCode" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "visibilitySetting" TEXT NOT NULL DEFAULT 'coaches_only',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "athleteId" TEXT,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "side" TEXT,
    "isManaged" BOOLEAN NOT NULL DEFAULT true,
    "concept2UserId" TEXT,
    "weightKg" DECIMAL(5,2),
    "heightCm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept2_auth" (
    "athleteId" TEXT NOT NULL,
    "c2UserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "concept2_auth_pkey" PRIMARY KEY ("athleteId")
);

-- CreateTable
CREATE TABLE "erg_tests" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "distanceM" INTEGER,
    "timeSeconds" DECIMAL(10,1) NOT NULL,
    "splitSeconds" DECIMAL(6,1),
    "watts" INTEGER,
    "strokeRate" INTEGER,
    "weightKg" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erg_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "c2LogbookId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "distanceM" INTEGER,
    "durationSeconds" DECIMAL(10,1),
    "strokeRate" INTEGER,
    "calories" INTEGER,
    "dragFactor" INTEGER,
    "deviceInfo" JSONB,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_telemetry" (
    "workoutId" TEXT NOT NULL,
    "timeSeriesS" DECIMAL(10,1)[],
    "wattsSeries" INTEGER[],
    "heartRateSeries" INTEGER[],
    "strokeRateSeries" INTEGER[],
    "forceCurves" JSONB,

    CONSTRAINT "workout_telemetry_pkey" PRIMARY KEY ("workoutId")
);

-- CreateTable
CREATE TABLE "lineups" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineup_assignments" (
    "id" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "boatClass" TEXT NOT NULL,
    "shellName" TEXT,
    "seatNumber" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "isCoxswain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lineup_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shells" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boatClass" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "shells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_configs" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numSeats" INTEGER NOT NULL,
    "hasCoxswain" BOOLEAN NOT NULL,

    CONSTRAINT "boat_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "visibleTo" TEXT NOT NULL DEFAULT 'all',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("announcementId","userId")
);

-- CreateTable
CREATE TABLE "athlete_ratings" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ratingType" TEXT NOT NULL,
    "ratingValue" DECIMAL(8,2) NOT NULL DEFAULT 1000,
    "confidenceScore" DECIMAL(4,3),
    "racesCounted" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_telemetry" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "avgWatts" DECIMAL(6,2),
    "peakWatts" DECIMAL(6,2),
    "workPerStroke" DECIMAL(8,2),
    "slipDegrees" DECIMAL(5,2),
    "washDegrees" DECIMAL(5,2),
    "catchAngle" DECIMAL(5,2),
    "finishAngle" DECIMAL(5,2),
    "peakForceAngle" DECIMAL(5,2),
    "techScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "athlete_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "teams_inviteCode_key" ON "teams"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_teamId_key" ON "team_members"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "invitations_tokenHash_idx" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "athletes_teamId_idx" ON "athletes"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_teamId_lastName_firstName_key" ON "athletes"("teamId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "erg_tests_teamId_idx" ON "erg_tests"("teamId");

-- CreateIndex
CREATE INDEX "erg_tests_athleteId_idx" ON "erg_tests"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "workouts_c2LogbookId_key" ON "workouts"("c2LogbookId");

-- CreateIndex
CREATE INDEX "workouts_teamId_idx" ON "workouts"("teamId");

-- CreateIndex
CREATE INDEX "workouts_athleteId_idx" ON "workouts"("athleteId");

-- CreateIndex
CREATE INDEX "lineups_teamId_idx" ON "lineups"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "shells_teamId_name_key" ON "shells"("teamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "boat_configs_teamId_name_key" ON "boat_configs"("teamId", "name");

-- CreateIndex
CREATE INDEX "announcements_teamId_idx" ON "announcements"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_ratings_athleteId_ratingType_key" ON "athlete_ratings"("athleteId", "ratingType");

-- CreateIndex
CREATE INDEX "athlete_telemetry_athleteId_idx" ON "athlete_telemetry"("athleteId");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athletes" ADD CONSTRAINT "athletes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept2_auth" ADD CONSTRAINT "concept2_auth_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erg_tests" ADD CONSTRAINT "erg_tests_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "erg_tests" ADD CONSTRAINT "erg_tests_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_telemetry" ADD CONSTRAINT "workout_telemetry_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_assignments" ADD CONSTRAINT "lineup_assignments_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "lineups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_assignments" ADD CONSTRAINT "lineup_assignments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shells" ADD CONSTRAINT "shells_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_configs" ADD CONSTRAINT "boat_configs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_ratings" ADD CONSTRAINT "athlete_ratings_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_telemetry" ADD CONSTRAINT "athlete_telemetry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

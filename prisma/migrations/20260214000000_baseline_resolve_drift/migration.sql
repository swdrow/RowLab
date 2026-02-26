-- CreateEnum
CREATE TYPE "ShellType" AS ENUM ('EIGHT', 'FOUR', 'QUAD', 'DOUBLE', 'PAIR', 'SINGLE');

-- CreateEnum
CREATE TYPE "WeightClass" AS ENUM ('HEAVYWEIGHT', 'LIGHTWEIGHT', 'OPENWEIGHT');

-- CreateEnum
CREATE TYPE "RiggingType" AS ENUM ('SWEEP', 'SCULL');

-- CreateEnum
CREATE TYPE "OarType" AS ENUM ('SWEEP', 'SCULL');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "AvailabilitySlot" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAYBE', 'NOT_SET');

-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('CONCEPT2', 'STRAVA', 'MANUAL', 'CALENDAR', 'WATER_SESSION');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('ERG', 'ROW', 'LIFT', 'RUN', 'CROSS_TRAIN', 'RECOVERY');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PieceSegment" AS ENUM ('WARMUP', 'MAIN', 'COOLDOWN');

-- DropForeignKey
ALTER TABLE "concept2_auth" DROP CONSTRAINT "concept2_auth_athleteId_fkey";

-- AlterTable
ALTER TABLE "athletes" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "canCox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canScull" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "classYear" INTEGER,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gamificationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "concept2_auth" DROP CONSTRAINT "concept2_auth_pkey",
DROP COLUMN "athleteId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "username" TEXT,
ADD CONSTRAINT "concept2_auth_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "races" ADD COLUMN     "eventId" TEXT;

-- AlterTable
ALTER TABLE "regattas" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "host" TEXT,
ADD COLUMN     "teamGoals" TEXT,
ADD COLUMN     "venueType" TEXT;

-- AlterTable
ALTER TABLE "shells" ADD COLUMN     "rigging" "RiggingType" NOT NULL,
ADD COLUMN     "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "type" "ShellType" NOT NULL,
ADD COLUMN     "weightClass" "WeightClass" NOT NULL;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "aiModel" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workouts" ADD COLUMN     "avgHeartRate" INTEGER,
ADD COLUMN     "avgPace" DECIMAL(8,1),
ADD COLUMN     "avgWatts" INTEGER,
ADD COLUMN     "inferredPattern" JSONB,
ADD COLUMN     "machineType" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "stravaActivityId" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "athleteId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "morningSlot" "AvailabilitySlot" NOT NULL DEFAULT 'NOT_SET',
    "eveningSlot" "AvailabilitySlot" NOT NULL DEFAULT 'NOT_SET',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default_schedules" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "schedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whiteboards" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whiteboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinnedModules" JSONB NOT NULL DEFAULT '[]',
    "hiddenSources" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "source" "ActivitySource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "activityType" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strava_auth" (
    "userId" TEXT NOT NULL,
    "stravaAthleteId" BIGINT NOT NULL,
    "username" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "c2ToStravaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "c2ToStravaTypes" JSONB NOT NULL DEFAULT '{}',
    "lastC2SyncedAt" TIMESTAMP(3),

    CONSTRAINT "strava_auth_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "workout_splits" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "splitNumber" INTEGER NOT NULL,
    "distanceM" INTEGER,
    "timeSeconds" DECIMAL(10,1),
    "pace" DECIMAL(8,1),
    "watts" INTEGER,
    "strokeRate" INTEGER,
    "heartRate" INTEGER,
    "dragFactor" INTEGER,
    "calories" INTEGER,

    CONSTRAINT "workout_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oar_sets" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OarType" NOT NULL,
    "count" INTEGER NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,

    CONSTRAINT "oar_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passive_observations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "sessionId" TEXT,
    "pieceId" TEXT,
    "boat1Athletes" TEXT[],
    "boat2Athletes" TEXT[],
    "swappedAthlete1Id" TEXT NOT NULL,
    "swappedAthlete2Id" TEXT NOT NULL,
    "splitDifferenceSeconds" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "appliedToRatings" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passive_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "regattaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "scheduledDay" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_checklists" (
    "id" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "race_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_checklist_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "race_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_rankings" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "externalTeamId" TEXT NOT NULL,
    "boatClass" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL,
    "season" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'all',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_sessions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "location" TEXT,
    "conditions" TEXT,
    "notes" TEXT,
    "calendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat_sessions" (
    "id" TEXT NOT NULL,
    "waterSessionId" TEXT NOT NULL,
    "boatId" TEXT,
    "boatName" TEXT NOT NULL,
    "coxswainId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_pieces" (
    "id" TEXT NOT NULL,
    "boatSessionId" TEXT NOT NULL,
    "pieceNumber" INTEGER NOT NULL,
    "distance" INTEGER,
    "timeSeconds" DECIMAL(10,1),
    "strokeRate" INTEGER,
    "pieceType" TEXT,
    "notes" TEXT,
    "startTime" TIMESTAMP(3),

    CONSTRAINT "water_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "darkMode" BOOLEAN NOT NULL DEFAULT true,
    "compactView" BOOLEAN NOT NULL DEFAULT false,
    "autoSave" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "phase" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_workouts" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "weekNumber" INTEGER,
    "duration" INTEGER,
    "distance" INTEGER,
    "targetPace" DOUBLE PRECISION,
    "targetHeartRate" INTEGER,
    "intensity" TEXT,
    "recurrenceRule" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_assignments" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "workout_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_completions" (
    "id" TEXT NOT NULL,
    "plannedWorkoutId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "workoutId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compliance" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "workout_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "notes" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED',
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sessionCode" TEXT,
    "athleteVisibility" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pieces" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "segment" "PieceSegment" NOT NULL DEFAULT 'MAIN',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "distance" INTEGER,
    "duration" INTEGER,
    "targetSplit" INTEGER,
    "targetRate" INTEGER,
    "targetWatts" INTEGER,
    "targetHRZone" TEXT,
    "targetRPE" INTEGER,
    "notes" TEXT,
    "boatClass" TEXT,
    "sets" INTEGER,
    "reps" INTEGER,

    CONSTRAINT "pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "participationPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autoRecorded" BOOLEAN NOT NULL DEFAULT true,
    "overriddenAt" TIMESTAMP(3),
    "overriddenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruit_visits" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "recruitName" TEXT NOT NULL,
    "recruitEmail" TEXT,
    "recruitPhone" TEXT,
    "recruitSchool" TEXT,
    "recruitGradYear" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "hostAthleteId" TEXT,
    "scheduleType" TEXT NOT NULL DEFAULT 'richtext',
    "scheduleContent" TEXT,
    "schedulePdfUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "shareToken" TEXT,
    "shareEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruit_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_achievements" (
    "athleteId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_achievements_pkey" PRIMARY KEY ("athleteId","achievementId")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "formula" JSONB,
    "handicap" JSONB,
    "templateId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_participants" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "score" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "contribution" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeContext" TEXT,
    "ergTestId" TEXT NOT NULL,
    "result" DECIMAL(10,1) NOT NULL,
    "previousBest" DECIMAL(10,1),
    "improvement" DECIMAL(10,1),
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rigging_profiles" (
    "id" TEXT NOT NULL,
    "shellId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "defaults" JSONB NOT NULL,
    "perSeat" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rigging_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineup_templates" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "boatClass" TEXT NOT NULL,
    "assignments" JSONB NOT NULL,
    "rigging" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineup_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_assignments" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "lineupId" TEXT,
    "sessionId" TEXT,
    "shellId" TEXT,
    "oarSetId" TEXT,
    "assignedDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_cards" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "cardType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "title" TEXT,
    "description" TEXT,
    "athleteName" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "availability_athleteId_idx" ON "availability"("athleteId");

-- CreateIndex
CREATE INDEX "availability_date_idx" ON "availability"("date");

-- CreateIndex
CREATE UNIQUE INDEX "availability_athleteId_date_key" ON "availability"("athleteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "default_schedules_athleteId_key" ON "default_schedules"("athleteId");

-- CreateIndex
CREATE INDEX "attendance_teamId_date_idx" ON "attendance"("teamId", "date");

-- CreateIndex
CREATE INDEX "attendance_athleteId_idx" ON "attendance"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_athleteId_date_key" ON "attendance"("athleteId", "date");

-- CreateIndex
CREATE INDEX "whiteboards_teamId_idx" ON "whiteboards"("teamId");

-- CreateIndex
CREATE INDEX "whiteboards_date_idx" ON "whiteboards"("date");

-- CreateIndex
CREATE UNIQUE INDEX "whiteboards_teamId_date_key" ON "whiteboards"("teamId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_preferences_userId_key" ON "dashboard_preferences"("userId");

-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");

-- CreateIndex
CREATE INDEX "activities_teamId_idx" ON "activities"("teamId");

-- CreateIndex
CREATE INDEX "activities_date_idx" ON "activities"("date");

-- CreateIndex
CREATE UNIQUE INDEX "activities_source_sourceId_key" ON "activities"("source", "sourceId");

-- CreateIndex
CREATE INDEX "strava_auth_stravaAthleteId_idx" ON "strava_auth"("stravaAthleteId");

-- CreateIndex
CREATE INDEX "workout_splits_workoutId_idx" ON "workout_splits"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_splits_workoutId_splitNumber_key" ON "workout_splits"("workoutId", "splitNumber");

-- CreateIndex
CREATE UNIQUE INDEX "oar_sets_teamId_name_key" ON "oar_sets"("teamId", "name");

-- CreateIndex
CREATE INDEX "passive_observations_teamId_idx" ON "passive_observations"("teamId");

-- CreateIndex
CREATE INDEX "passive_observations_sessionId_idx" ON "passive_observations"("sessionId");

-- CreateIndex
CREATE INDEX "passive_observations_appliedToRatings_idx" ON "passive_observations"("appliedToRatings");

-- CreateIndex
CREATE INDEX "events_regattaId_idx" ON "events"("regattaId");

-- CreateIndex
CREATE INDEX "checklist_templates_teamId_idx" ON "checklist_templates"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "race_checklists_raceId_key" ON "race_checklists"("raceId");

-- CreateIndex
CREATE UNIQUE INDEX "external_rankings_teamId_externalTeamId_boatClass_source_se_key" ON "external_rankings"("teamId", "externalTeamId", "boatClass", "source", "season");

-- CreateIndex
CREATE INDEX "calendar_events_teamId_idx" ON "calendar_events"("teamId");

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "water_sessions_teamId_idx" ON "water_sessions"("teamId");

-- CreateIndex
CREATE INDEX "water_sessions_date_idx" ON "water_sessions"("date");

-- CreateIndex
CREATE INDEX "boat_sessions_waterSessionId_idx" ON "boat_sessions"("waterSessionId");

-- CreateIndex
CREATE INDEX "boat_sessions_coxswainId_idx" ON "boat_sessions"("coxswainId");

-- CreateIndex
CREATE INDEX "water_pieces_boatSessionId_idx" ON "water_pieces"("boatSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "training_plans_teamId_idx" ON "training_plans"("teamId");

-- CreateIndex
CREATE INDEX "training_plans_createdBy_idx" ON "training_plans"("createdBy");

-- CreateIndex
CREATE INDEX "planned_workouts_planId_idx" ON "planned_workouts"("planId");

-- CreateIndex
CREATE INDEX "planned_workouts_scheduledDate_idx" ON "planned_workouts"("scheduledDate");

-- CreateIndex
CREATE INDEX "workout_assignments_athleteId_idx" ON "workout_assignments"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_assignments_planId_athleteId_key" ON "workout_assignments"("planId", "athleteId");

-- CreateIndex
CREATE INDEX "workout_completions_athleteId_idx" ON "workout_completions"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "workout_completions_plannedWorkoutId_athleteId_key" ON "workout_completions"("plannedWorkoutId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionCode_key" ON "sessions"("sessionCode");

-- CreateIndex
CREATE INDEX "sessions_teamId_date_idx" ON "sessions"("teamId", "date");

-- CreateIndex
CREATE INDEX "pieces_sessionId_order_idx" ON "pieces"("sessionId", "order");

-- CreateIndex
CREATE INDEX "session_attendance_sessionId_idx" ON "session_attendance"("sessionId");

-- CreateIndex
CREATE INDEX "session_attendance_athleteId_idx" ON "session_attendance"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendance_sessionId_athleteId_key" ON "session_attendance"("sessionId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "recruit_visits_shareToken_key" ON "recruit_visits"("shareToken");

-- CreateIndex
CREATE INDEX "recruit_visits_teamId_idx" ON "recruit_visits"("teamId");

-- CreateIndex
CREATE INDEX "recruit_visits_hostAthleteId_idx" ON "recruit_visits"("hostAthleteId");

-- CreateIndex
CREATE INDEX "recruit_visits_date_idx" ON "recruit_visits"("date");

-- CreateIndex
CREATE INDEX "recruit_visits_shareToken_idx" ON "recruit_visits"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_category_key" ON "achievements"("name", "category");

-- CreateIndex
CREATE INDEX "athlete_achievements_athleteId_idx" ON "athlete_achievements"("athleteId");

-- CreateIndex
CREATE INDEX "athlete_achievements_unlockedAt_idx" ON "athlete_achievements"("unlockedAt");

-- CreateIndex
CREATE INDEX "challenges_teamId_idx" ON "challenges"("teamId");

-- CreateIndex
CREATE INDEX "challenges_status_idx" ON "challenges"("status");

-- CreateIndex
CREATE INDEX "challenges_endDate_idx" ON "challenges"("endDate");

-- CreateIndex
CREATE INDEX "challenge_participants_challengeId_idx" ON "challenge_participants"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_participants_score_idx" ON "challenge_participants"("score");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participants_challengeId_athleteId_key" ON "challenge_participants"("challengeId", "athleteId");

-- CreateIndex
CREATE INDEX "personal_records_athleteId_idx" ON "personal_records"("athleteId");

-- CreateIndex
CREATE INDEX "personal_records_teamId_idx" ON "personal_records"("teamId");

-- CreateIndex
CREATE INDEX "personal_records_testType_idx" ON "personal_records"("testType");

-- CreateIndex
CREATE UNIQUE INDEX "personal_records_athleteId_testType_scope_scopeContext_key" ON "personal_records"("athleteId", "testType", "scope", "scopeContext");

-- CreateIndex
CREATE UNIQUE INDEX "rigging_profiles_shellId_key" ON "rigging_profiles"("shellId");

-- CreateIndex
CREATE INDEX "rigging_profiles_teamId_idx" ON "rigging_profiles"("teamId");

-- CreateIndex
CREATE INDEX "lineup_templates_teamId_idx" ON "lineup_templates"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "lineup_templates_teamId_name_key" ON "lineup_templates"("teamId", "name");

-- CreateIndex
CREATE INDEX "equipment_assignments_teamId_assignedDate_idx" ON "equipment_assignments"("teamId", "assignedDate");

-- CreateIndex
CREATE INDEX "equipment_assignments_shellId_assignedDate_idx" ON "equipment_assignments"("shellId", "assignedDate");

-- CreateIndex
CREATE INDEX "share_cards_userId_idx" ON "share_cards"("userId");

-- CreateIndex
CREATE INDEX "share_cards_workoutId_idx" ON "share_cards"("workoutId");

-- CreateIndex
CREATE INDEX "share_cards_expiresAt_idx" ON "share_cards"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "concept2_auth_c2UserId_idx" ON "concept2_auth"("c2UserId");

-- CreateIndex
CREATE INDEX "races_eventId_idx" ON "races"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "workouts_stravaActivityId_key" ON "workouts"("stravaActivityId");

-- CreateIndex
CREATE INDEX "workouts_userId_idx" ON "workouts"("userId");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default_schedules" ADD CONSTRAINT "default_schedules_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_preferences" ADD CONSTRAINT "dashboard_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept2_auth" ADD CONSTRAINT "concept2_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strava_auth" ADD CONSTRAINT "strava_auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_splits" ADD CONSTRAINT "workout_splits_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oar_sets" ADD CONSTRAINT "oar_sets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passive_observations" ADD CONSTRAINT "passive_observations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passive_observations" ADD CONSTRAINT "passive_observations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passive_observations" ADD CONSTRAINT "passive_observations_swappedAthlete1Id_fkey" FOREIGN KEY ("swappedAthlete1Id") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passive_observations" ADD CONSTRAINT "passive_observations_swappedAthlete2Id_fkey" FOREIGN KEY ("swappedAthlete2Id") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_regattaId_fkey" FOREIGN KEY ("regattaId") REFERENCES "regattas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_checklists" ADD CONSTRAINT "race_checklists_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_checklists" ADD CONSTRAINT "race_checklists_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_checklist_items" ADD CONSTRAINT "race_checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "race_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_rankings" ADD CONSTRAINT "external_rankings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_rankings" ADD CONSTRAINT "external_rankings_externalTeamId_fkey" FOREIGN KEY ("externalTeamId") REFERENCES "external_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_sessions" ADD CONSTRAINT "water_sessions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_sessions" ADD CONSTRAINT "water_sessions_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_sessions" ADD CONSTRAINT "boat_sessions_waterSessionId_fkey" FOREIGN KEY ("waterSessionId") REFERENCES "water_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_sessions" ADD CONSTRAINT "boat_sessions_coxswainId_fkey" FOREIGN KEY ("coxswainId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_pieces" ADD CONSTRAINT "water_pieces_boatSessionId_fkey" FOREIGN KEY ("boatSessionId") REFERENCES "boat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_workouts" ADD CONSTRAINT "planned_workouts_planId_fkey" FOREIGN KEY ("planId") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_assignments" ADD CONSTRAINT "workout_assignments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_assignments" ADD CONSTRAINT "workout_assignments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_assignments" ADD CONSTRAINT "workout_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_completions" ADD CONSTRAINT "workout_completions_plannedWorkoutId_fkey" FOREIGN KEY ("plannedWorkoutId") REFERENCES "planned_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_completions" ADD CONSTRAINT "workout_completions_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_completions" ADD CONSTRAINT "workout_completions_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pieces" ADD CONSTRAINT "pieces_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_visits" ADD CONSTRAINT "recruit_visits_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_visits" ADD CONSTRAINT "recruit_visits_hostAthleteId_fkey" FOREIGN KEY ("hostAthleteId") REFERENCES "athletes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruit_visits" ADD CONSTRAINT "recruit_visits_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_achievements" ADD CONSTRAINT "athlete_achievements_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_achievements" ADD CONSTRAINT "athlete_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rigging_profiles" ADD CONSTRAINT "rigging_profiles_shellId_fkey" FOREIGN KEY ("shellId") REFERENCES "shells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rigging_profiles" ADD CONSTRAINT "rigging_profiles_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_templates" ADD CONSTRAINT "lineup_templates_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "lineups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_shellId_fkey" FOREIGN KEY ("shellId") REFERENCES "shells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_oarSetId_fkey" FOREIGN KEY ("oarSetId") REFERENCES "oar_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_cards" ADD CONSTRAINT "share_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;



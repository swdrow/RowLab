-- Team Experience Phase: Schema extensions
-- Adds generatedId, description, sport, welcomeMessage to Team
-- Adds TeamInviteCode and TeamActivity models
-- Adds activeTeamId to User
-- Makes Team.slug nullable (generatedId is the required identifier)

-- Step 1: Add new nullable columns to teams
ALTER TABLE "teams" ADD COLUMN "generatedId" TEXT;
ALTER TABLE "teams" ADD COLUMN "description" TEXT;
ALTER TABLE "teams" ADD COLUMN "sport" TEXT;
ALTER TABLE "teams" ADD COLUMN "welcomeMessage" TEXT;

-- Step 2: Backfill generatedId for existing teams with a unique placeholder
UPDATE "teams" SET "generatedId" = 'legacy-' || LEFT(MD5(id::text), 8) WHERE "generatedId" IS NULL;

-- Step 3: Make generatedId NOT NULL and add unique constraint
ALTER TABLE "teams" ALTER COLUMN "generatedId" SET NOT NULL;
CREATE UNIQUE INDEX "teams_generatedId_key" ON "teams"("generatedId");

-- Step 4: Make slug nullable (generatedId is the required identifier now)
ALTER TABLE "teams" ALTER COLUMN "slug" DROP NOT NULL;

-- Step 5: Add activeTeamId to users
ALTER TABLE "users" ADD COLUMN "activeTeamId" TEXT;

-- Step 6: Create TeamInviteCode table
CREATE TABLE "team_invite_codes" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ATHLETE',
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invite_codes_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create TeamActivity table
CREATE TABLE "team_activities" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_activities_pkey" PRIMARY KEY ("id")
);

-- Step 8: Add indexes
CREATE UNIQUE INDEX "team_invite_codes_code_key" ON "team_invite_codes"("code");
CREATE INDEX "team_invite_codes_teamId_idx" ON "team_invite_codes"("teamId");
CREATE INDEX "team_activities_teamId_createdAt_idx" ON "team_activities"("teamId", "createdAt");

-- Step 9: Add foreign keys
ALTER TABLE "team_invite_codes" ADD CONSTRAINT "team_invite_codes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

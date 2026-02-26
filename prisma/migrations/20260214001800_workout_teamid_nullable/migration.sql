-- Backfill userId from athlete records (run before CHECK constraint)
UPDATE "workouts" w
SET "userId" = a."userId"
FROM "athletes" a
WHERE w."athleteId" = a."id"
  AND a."userId" IS NOT NULL
  AND w."userId" IS NULL;

-- Add CHECK constraint: every workout must have at least teamId or userId
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_team_or_user_required"
  CHECK ("teamId" IS NOT NULL OR "userId" IS NOT NULL);

-- DropForeignKey
ALTER TABLE "workouts" DROP CONSTRAINT "workouts_teamId_fkey";

-- AlterTable: make teamId nullable
ALTER TABLE "workouts" ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey with ON DELETE SET NULL
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

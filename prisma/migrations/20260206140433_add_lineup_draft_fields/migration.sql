-- AlterTable: Add draft/publish fields to Lineup model
-- Phase 25 Plan 01: State Management Migration Foundation

-- Add status column with default "published" (all existing lineups become published)
ALTER TABLE "lineups" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'published';

-- Add draftedBy column (nullable FK to users)
ALTER TABLE "lineups" ADD COLUMN "draftedBy" TEXT;

-- Add publishedAt column (nullable)
ALTER TABLE "lineups" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Add foreign key constraint for draftedBy -> users.id
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_draftedBy_fkey" FOREIGN KEY ("draftedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add composite index for filtering by team and status
CREATE INDEX "lineups_teamId_status_idx" ON "lineups"("teamId", "status");

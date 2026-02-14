-- CreateTable
CREATE TABLE "team_feature_flags" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "athleteReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_feature_flags_teamId_idx" ON "team_feature_flags"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "team_feature_flags_teamId_tool_key" ON "team_feature_flags"("teamId", "tool");

-- AddForeignKey
ALTER TABLE "team_feature_flags" ADD CONSTRAINT "team_feature_flags_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

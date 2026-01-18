/*
  Warnings:

  - You are about to drop the column `racesCounted` on the `athlete_ratings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "athlete_ratings" DROP COLUMN "racesCounted",
ADD COLUMN     "racesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "seat_race_sessions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "conditions" TEXT,
    "boatClass" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_race_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_race_pieces" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "distanceMeters" INTEGER,
    "direction" TEXT,
    "notes" TEXT,

    CONSTRAINT "seat_race_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_race_boats" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shellName" TEXT,
    "finishTimeSeconds" DECIMAL(10,2),
    "handicapSeconds" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "seat_race_boats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_race_assignments" (
    "id" TEXT NOT NULL,
    "boatId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "side" TEXT NOT NULL,

    CONSTRAINT "seat_race_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seat_race_sessions_teamId_idx" ON "seat_race_sessions"("teamId");

-- AddForeignKey
ALTER TABLE "seat_race_sessions" ADD CONSTRAINT "seat_race_sessions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_race_pieces" ADD CONSTRAINT "seat_race_pieces_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "seat_race_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_race_boats" ADD CONSTRAINT "seat_race_boats_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "seat_race_pieces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_race_assignments" ADD CONSTRAINT "seat_race_assignments_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "seat_race_boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_race_assignments" ADD CONSTRAINT "seat_race_assignments_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

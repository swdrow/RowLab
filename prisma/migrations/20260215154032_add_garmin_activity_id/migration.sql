/*
  Warnings:

  - A unique constraint covering the columns `[garminActivityId]` on the table `workouts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workouts" ADD COLUMN     "garminActivityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workouts_garminActivityId_key" ON "workouts"("garminActivityId");

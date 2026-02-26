-- CreateIndex
CREATE INDEX "workouts_userId_type_machineType_idx" ON "workouts"("userId", "type", "machineType");

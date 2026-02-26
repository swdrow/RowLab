-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "acwrAlertThreshold" DECIMAL(3,1) DEFAULT 1.5,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "functionalThresholdPower" INTEGER,
ADD COLUMN     "lactateThresholdHR" INTEGER,
ADD COLUMN     "maxHeartRate" INTEGER,
ADD COLUMN     "tsbAlertThreshold" INTEGER DEFAULT -30;

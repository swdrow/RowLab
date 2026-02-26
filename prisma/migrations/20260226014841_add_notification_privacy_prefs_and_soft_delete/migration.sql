-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "notificationPrefs" JSONB,
ADD COLUMN     "privacyPrefs" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3);

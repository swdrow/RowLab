-- AlterTable
ALTER TABLE "users" ADD COLUMN "googleId" TEXT,
ADD COLUMN "provider" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

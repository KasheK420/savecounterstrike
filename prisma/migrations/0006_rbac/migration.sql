-- Add ban fields to User
ALTER TABLE "User" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "bannedReason" TEXT;

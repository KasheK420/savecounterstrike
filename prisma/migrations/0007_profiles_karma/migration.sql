-- Add profile and karma fields to User
ALTER TABLE "User" ADD COLUMN "bio" VARCHAR(500);
ALTER TABLE "User" ADD COLUMN "karma" INTEGER NOT NULL DEFAULT 0;

-- Add editedAt to Opinion
ALTER TABLE "Opinion" ADD COLUMN "editedAt" TIMESTAMP(3);

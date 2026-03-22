-- Add privacy controls to User
ALTER TABLE "User" ADD COLUMN "customName" VARCHAR(32);
ALTER TABLE "User" ADD COLUMN "hidePlaytime" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "hideFaceit" BOOLEAN NOT NULL DEFAULT false;

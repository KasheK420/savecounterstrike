-- AlterTable: Make userId optional, add manual signature fields
ALTER TABLE "PetitionSignature" ALTER COLUMN "userId" DROP NOT NULL;

-- Add new columns for manual signatures
ALTER TABLE "PetitionSignature" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PetitionSignature" ADD COLUMN "steamId" TEXT;
ALTER TABLE "PetitionSignature" ADD COLUMN "displayName" TEXT;
ALTER TABLE "PetitionSignature" ADD COLUMN "avatarUrl" TEXT;

-- Drop the old unique constraint on userId (manual signatures have null userId)
ALTER TABLE "PetitionSignature" DROP CONSTRAINT IF EXISTS "PetitionSignature_userId_key";

-- Add unique constraint on steamId (one signature per Steam account for manual)
ALTER TABLE "PetitionSignature" ADD CONSTRAINT "PetitionSignature_steamId_key" UNIQUE ("steamId");

-- Add tags to Opinion and Media
ALTER TABLE "Opinion" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Media" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

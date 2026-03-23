-- AlterTable: OpinionVote — make userId optional, add ipHash
ALTER TABLE "OpinionVote" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "OpinionVote" ADD COLUMN "ipHash" TEXT;

-- Drop old unique (will recreate, Prisma needs clean re-add for nullable column)
ALTER TABLE "OpinionVote" DROP CONSTRAINT IF EXISTS "OpinionVote_opinionId_userId_key";

-- Recreate unique allowing nulls (PostgreSQL treats NULL as distinct in unique)
CREATE UNIQUE INDEX "OpinionVote_opinionId_userId_key" ON "OpinionVote"("opinionId", "userId");

-- Add ipHash unique constraint
CREATE UNIQUE INDEX "OpinionVote_opinionId_ipHash_key" ON "OpinionVote"("opinionId", "ipHash");


-- AlterTable: CommentVote — make userId optional, add ipHash
ALTER TABLE "CommentVote" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "CommentVote" ADD COLUMN "ipHash" TEXT;

ALTER TABLE "CommentVote" DROP CONSTRAINT IF EXISTS "CommentVote_commentId_userId_key";
CREATE UNIQUE INDEX "CommentVote_commentId_userId_key" ON "CommentVote"("commentId", "userId");
CREATE UNIQUE INDEX "CommentVote_commentId_ipHash_key" ON "CommentVote"("commentId", "ipHash");


-- AlterTable: MediaVote — make userId optional, add ipHash
ALTER TABLE "MediaVote" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "MediaVote" ADD COLUMN "ipHash" TEXT;

ALTER TABLE "MediaVote" DROP CONSTRAINT IF EXISTS "MediaVote_mediaId_userId_key";
CREATE UNIQUE INDEX "MediaVote_mediaId_userId_key" ON "MediaVote"("mediaId", "userId");
CREATE UNIQUE INDEX "MediaVote_mediaId_ipHash_key" ON "MediaVote"("mediaId", "ipHash");

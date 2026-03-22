CREATE TABLE "OutreachContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Other',
    "email" TEXT,
    "socialUrl" TEXT,
    "websiteUrl" TEXT,
    "avatarUrl" TEXT,
    "emailBody" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "repliedAt" TIMESTAMP(3),
    "engaged" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "addToSupporters" BOOLEAN NOT NULL DEFAULT false,
    "addToNotable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OutreachContact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutreachContact_role_idx" ON "OutreachContact"("role");
CREATE INDEX "OutreachContact_emailSent_idx" ON "OutreachContact"("emailSent");
CREATE INDEX "OutreachContact_engaged_idx" ON "OutreachContact"("engaged");

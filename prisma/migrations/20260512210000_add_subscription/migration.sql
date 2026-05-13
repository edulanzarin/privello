-- CreateEnum
CREATE TYPE IF NOT EXISTS "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable User: add slug column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_slug_key" ON "User"("slug");

-- AlterTable Media: add caption and createdAt
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "Media" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Media_mediaType_isPublic_createdAt_idx" ON "Media"("mediaType", "isPublic", "createdAt" DESC);

-- Drop old Review table (schema changed significantly) and recreate
DROP TABLE IF EXISTS "Review" CASCADE;

-- CreateTable Review (new schema)
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Review_profileId_userId_key" ON "Review"("profileId", "userId");
CREATE INDEX IF NOT EXISTS "Review_profileId_createdAt_idx" ON "Review"("profileId", "createdAt" DESC);

ALTER TABLE "Review" ADD CONSTRAINT "Review_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable MediaLike
CREATE TABLE IF NOT EXISTS "MediaLike" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MediaLike_mediaId_userId_key" ON "MediaLike"("mediaId", "userId");
CREATE INDEX IF NOT EXISTS "MediaLike_mediaId_idx" ON "MediaLike"("mediaId");

ALTER TABLE "MediaLike" ADD CONSTRAINT "MediaLike_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaLike" ADD CONSTRAINT "MediaLike_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable MediaComment
CREATE TABLE IF NOT EXISTS "MediaComment" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MediaComment_mediaId_createdAt_idx" ON "MediaComment"("mediaId", "createdAt");
CREATE INDEX IF NOT EXISTS "MediaComment_userId_idx" ON "MediaComment"("userId");

ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

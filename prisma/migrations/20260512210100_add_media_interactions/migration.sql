-- CreateTable MediaLike
CREATE TABLE "MediaLike" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaLike_mediaId_userId_key" ON "MediaLike"("mediaId", "userId");
CREATE INDEX "MediaLike_mediaId_idx" ON "MediaLike"("mediaId");

ALTER TABLE "MediaLike" ADD CONSTRAINT "MediaLike_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaLike" ADD CONSTRAINT "MediaLike_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable MediaComment
CREATE TABLE "MediaComment" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaComment_mediaId_createdAt_idx" ON "MediaComment"("mediaId", "createdAt");
CREATE INDEX "MediaComment_userId_idx" ON "MediaComment"("userId");

ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_mediaId_fkey"
    FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaComment" ADD CONSTRAINT "MediaComment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

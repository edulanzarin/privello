-- Add suspension fields to Profile
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "suspensionNote" TEXT;

-- Create Warning table
CREATE TABLE IF NOT EXISTS "Warning" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Warning_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Warning" ADD CONSTRAINT "Warning_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Warning" ADD CONSTRAINT "Warning_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Warning_profileId_createdAt_idx" ON "Warning"("profileId", "createdAt");
CREATE INDEX IF NOT EXISTS "Warning_adminId_idx" ON "Warning"("adminId");

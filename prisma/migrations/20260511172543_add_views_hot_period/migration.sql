-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROVIDER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('ESSENCIAL', 'DESTAQUE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "MeetingRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('NOVO', 'REVISAO', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "FinancialOrigin" AS ENUM ('SITE', 'WHATSAPP', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "phone" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "heroImage" TEXT,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "tagline" TEXT,
    "cityId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "priceHour" INTEGER NOT NULL,
    "priceTwoHours" INTEGER,
    "priceOvernight" INTEGER,
    "priceTravelDay" INTEGER,
    "paymentMethods" TEXT,
    "heightCm" INTEGER,
    "dressSize" TEXT,
    "hair" TEXT,
    "eyes" TEXT,
    "languages" TEXT,
    "servesMen" BOOLEAN NOT NULL DEFAULT true,
    "servesCouples" BOOLEAN NOT NULL DEFAULT false,
    "servesWomen" BOOLEAN NOT NULL DEFAULT false,
    "hasOwnPlace" BOOLEAN NOT NULL DEFAULT false,
    "homeVisit" BOOLEAN NOT NULL DEFAULT false,
    "travelsNational" BOOLEAN NOT NULL DEFAULT false,
    "travelsInternational" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhone" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "videoVerified" BOOLEAN NOT NULL DEFAULT false,
    "viewsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "viewsCurrentPeriod" INTEGER NOT NULL DEFAULT 0,
    "memberSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rankPosition" INTEGER,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "planTier" "PlanTier" NOT NULL DEFAULT 'ESSENCIAL',
    "featuredUntil" TIMESTAMP(3),
    "boostLabel" TEXT,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotPeriodConfig" (
    "id" TEXT NOT NULL DEFAULT 'hot',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HotPeriodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileDurationOption" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "priceBrl" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProfileDurationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reviewerInitials" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "punctuality" DOUBLE PRECISION NOT NULL,
    "descriptionScore" DOUBLE PRECISION NOT NULL,
    "conversation" DOUBLE PRECISION NOT NULL,
    "experience" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRequest" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "MeetingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "totalBrl" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "clientLabel" TEXT NOT NULL,
    "durationLabel" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "paymentLabel" TEXT NOT NULL,
    "origin" "FinancialOrigin" NOT NULL,
    "amountBrl" INTEGER NOT NULL,
    "isNoShow" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppClick" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "visitor" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WhatsAppClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCase" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'NOVO',
    "documentType" TEXT,
    "documentNote" TEXT,
    "selfieMatch" INTEGER,
    "selfieNote" TEXT,
    "waitingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "District_cityId_idx" ON "District"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_slug_key" ON "District"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_publicCode_key" ON "Profile"("publicCode");

-- CreateIndex
CREATE INDEX "Profile_cityId_isVerified_planTier_idx" ON "Profile"("cityId", "isVerified", "planTier");

-- CreateIndex
CREATE INDEX "Profile_cityId_districtId_idx" ON "Profile"("cityId", "districtId");

-- CreateIndex
CREATE INDEX "Profile_slug_idx" ON "Profile"("slug");

-- CreateIndex
CREATE INDEX "Profile_lastUpdatedAt_idx" ON "Profile"("lastUpdatedAt");

-- CreateIndex
CREATE INDEX "Profile_viewsCurrentPeriod_idx" ON "Profile"("viewsCurrentPeriod");

-- CreateIndex
CREATE INDEX "Media_profileId_isPublic_sortOrder_idx" ON "Media"("profileId", "isPublic", "sortOrder");

-- CreateIndex
CREATE INDEX "AvailabilityRule_profileId_weekday_idx" ON "AvailabilityRule"("profileId", "weekday");

-- CreateIndex
CREATE INDEX "ProfileDurationOption_profileId_active_sortOrder_idx" ON "ProfileDurationOption"("profileId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "Review_profileId_createdAt_idx" ON "Review"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "MeetingRequest_profileId_status_idx" ON "MeetingRequest"("profileId", "status");

-- CreateIndex
CREATE INDEX "MeetingRequest_clientId_idx" ON "MeetingRequest"("clientId");

-- CreateIndex
CREATE INDEX "FinancialRecord_profileId_occurredAt_idx" ON "FinancialRecord"("profileId", "occurredAt");

-- CreateIndex
CREATE INDEX "WhatsAppClick_profileId_clickedAt_idx" ON "WhatsAppClick"("profileId", "clickedAt");

-- CreateIndex
CREATE INDEX "VerificationCase_status_waitingSince_idx" ON "VerificationCase"("status", "waitingSince");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDurationOption" ADD CONSTRAINT "ProfileDurationOption_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRequest" ADD CONSTRAINT "MeetingRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppClick" ADD CONSTRAINT "WhatsAppClick_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCase" ADD CONSTRAINT "VerificationCase_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

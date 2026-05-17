-- Migration: sincroniza schema Prisma com banco de produção
--
-- Contexto: a migration inicial (20260514223958_init) refletia um schema
-- mais antigo que usava Stripe. Entre a migration inicial e o estado
-- atual do schema houve trocas (Stripe → Mercado Pago, isolamento de
-- planos, registro de cadastros pendentes pré-pagamento) que foram
-- aplicadas localmente via `prisma db push` mas nunca viraram migration
-- versionada. Em produção (Railway), só o `migrate deploy` roda; daí
-- as colunas e tabelas ficaram fora de sync.
--
-- Esta migration é gerada por `prisma migrate diff` contra o banco do
-- Railway e tras tudo de uma vez. Idempotente quando aplicada num banco
-- já em sync (Prisma trata como no-op se as colunas/tabelas já existem
-- via migrate resolve).

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_districtId_fkey";

-- DropIndex
DROP INDEX "Subscription_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ALTER COLUMN "districtId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "mpPaymentId" TEXT;

-- CreateTable
CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingRegistration_expiresAt_idx" ON "PendingRegistration"("expiresAt");

-- CreateIndex
CREATE INDEX "Profile_planTier_planExpiresAt_idx" ON "Profile"("planTier", "planExpiresAt");

-- CreateIndex
CREATE INDEX "Profile_isOnline_cityId_idx" ON "Profile"("isOnline", "cityId");

-- CreateIndex
CREATE INDEX "Profile_featuredUntil_idx" ON "Profile"("featuredUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_mpPaymentId_key" ON "Subscription"("mpPaymentId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_expiresAt_idx" ON "Subscription"("userId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

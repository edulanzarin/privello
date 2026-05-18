/**
 * Página RSC — Painel do provider: regras de disponibilidade semanal.
 *
 * Rota: `/painel/disponibilidade`.
 * Tipo: Server Component (form é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lê regras atuais do `Profile`).
 *
 * Editor das regras `AvailabilityRule` (status + janela horária por dia da
 * semana) consumidas pelas páginas pública e de solicitar.
 *
 * Cross-refs:
 * - src/app/painel/disponibilidade/availability-form.tsx
 * - src/app/painel/_actions/provider-settings.ts
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityForm } from "./availability-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 29 (regras de disponibilidade).
export const dynamic = "force-dynamic";

export default async function PainelDisponibilidadePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { availabilityRules: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Agenda
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
          Disponibilidade
        </h1>
        <p className="mt-2 text-md text-ink-dim">
          Defina seus horários por dia da semana.
        </p>
      </div>

      <AvailabilityForm
        initialRules={profile.availabilityRules.map((r) => ({
          weekday: r.weekday,
          status: r.status,
          startTime: r.startTime,
          endTime: r.endTime,
        }))}
      />
    </div>
  );
}

/**
 * Página RSC — Painel do provider: editor de valores e durações.
 *
 * Rota: `/painel/valores`.
 * Tipo: Server Component (form é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lê preços e durações atuais).
 *
 * Editor das `DurationOption` ativas + preços base do `Profile`.
 *
 * Cross-refs:
 * - src/app/painel/valores/valores-form.tsx
 * - src/app/painel/_actions/provider-settings.ts
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ValoresForm } from "./valores-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 30 (editor de valores e durações).
export const dynamic = "force-dynamic";

export default async function PainelValoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { durationOptions: { where: { active: true }, orderBy: { sortOrder: "asc"} } },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Valores e durações</h1>
        <p className="mt-1 text-md text-ink-dim">Ative as durações que você oferece e defina o valor de cada uma.</p>
      </div>
      <ValoresForm profile={profile} />
    </div>
  );
}

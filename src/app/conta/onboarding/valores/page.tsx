/**
 * Página RSC — Onboarding passo 03: valores — Design System v2.
 *
 * Rota: `/conta/onboarding/valores`.
 * Tipo: Server Component (form é Client).
 * Auth: acompanhante (PROVIDER) — exige sessão e `Profile` próprio.
 * Cache: `force-dynamic` (lê `auth()` + `Profile`).
 *
 * Cross-refs:
 *  - src/components/onboarding/onboarding-sidebar.tsx
 *  - src/app/conta/onboarding/valores/valores-form.tsx
 */
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { ValoresForm } from "./valores-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 18.
export const dynamic = "force-dynamic";

export default async function OnboardingValoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      durationOptions: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) redirect("/entrar");

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-screen flex-col md:flex-row">
        <OnboardingSidebar current="valores" />
        <main className="flex-1 px-6 py-10 md:px-14">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Passo 03 de 04
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Seus valores<span className="text-rose">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-dim">
            Defina seus preços por duração. Você pode alterar a qualquer momento
            no painel.
          </p>
          <ValoresForm profile={profile} />
        </main>
      </div>
    </ViewTransition>
  );
}

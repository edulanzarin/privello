/**
 * Página RSC — Onboarding passo 01: perfil — Design System v2.
 *
 * Rota: `/conta/onboarding/perfil`.
 * Tipo: Server Component (form é Client).
 * Auth: acompanhante (PROVIDER) — exige sessão e `Profile` próprio.
 * Cache: `force-dynamic` (lê `auth()` + `Profile`).
 *
 * Cross-refs:
 *  - src/components/onboarding/onboarding-sidebar.tsx
 *  - src/app/conta/onboarding/perfil/perfil-form.tsx
 *  - src/app/_actions/onboarding.ts
 */
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { PerfilForm } from "./perfil-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 17.
export const dynamic = "force-dynamic";

export default async function OnboardingPerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { city: true },
  });
  if (!profile) redirect("/entrar");

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-screen flex-col md:flex-row">
        <OnboardingSidebar current="perfil" />
        <main className="flex-1 px-6 py-10 md:px-14">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Passo 01 de 04
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Seu perfil<span className="text-rose">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-dim">
            Essas informações aparecem no seu anúncio. Seja autêntica — perfis
            completos convertem mais.
          </p>
          <PerfilForm
            profile={profile}
            cityName={profile.city?.name ?? ""}
            citySlug={profile.city?.slug ?? ""}
          />
        </main>
      </div>
    </ViewTransition>
  );
}

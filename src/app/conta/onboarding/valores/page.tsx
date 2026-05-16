import Link from "next/link";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { } from "react/canary";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { ValoresForm } from "./valores-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 18 (onboarding/valores autenticado).
export const dynamic = "force-dynamic";

export default async function OnboardingValoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { durationOptions: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
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
        <main className="flex-1 bg-background px-6 py-10 md:px-14">
          <p className="text-xs font-medium text-muted">Passo 03 de 04</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Seus valores<span className="text-coral">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Defina seus preços por duração. Você pode alterar a qualquer momento no painel.
          </p>
          <ValoresForm profile={profile} />
        </main>
      </div>
    </ViewTransition>
  );
}

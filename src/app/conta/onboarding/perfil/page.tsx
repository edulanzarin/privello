import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { PerfilForm } from "./perfil-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 17 (onboarding/perfil autenticado).
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
    <div className="flex min-h-screen flex-col md:flex-row">
      <OnboardingSidebar current="perfil" />
      <main className="flex-1 bg-background px-6 py-10 md:px-14">
        <p className="text-[11px] font-medium text-muted">Passo 01 de 04</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Seu perfil<span className="text-coral">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Essas informações aparecem no seu anúncio. Seja autêntica — perfis completos convertem mais.
        </p>
        <PerfilForm
          profile={profile}
          cityName={profile.city?.name ?? ""}
          citySlug={profile.city?.slug ?? ""}
        />
      </main>
    </div>
  );
}

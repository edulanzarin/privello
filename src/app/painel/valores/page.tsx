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
    include: { durationOptions: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Valores e durações</h1>
        <p className="mt-1 text-[14px] text-muted">Ative as durações que você oferece e defina o valor de cada uma.</p>
      </div>
      <ValoresForm profile={profile} />
    </div>
  );
}

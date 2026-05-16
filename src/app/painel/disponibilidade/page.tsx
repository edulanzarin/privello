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
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Disponibilidade</h1>
        <p className="mt-1 text-[14px] text-muted">
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

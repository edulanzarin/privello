import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveAvailabilityWindows } from "@/app/painel/_actions/provider-settings";
import { SaveForm } from "@/components/painel/save-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const TIME_OPTIONS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00",
  "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00", "23:59",
];

const timeSelectOptions = TIME_OPTIONS.map((t) => ({ value: t, label: t }));

export default async function PainelDisponibilidadePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { availabilityRules: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const byWd = new Map(profile.availabilityRules.map((r) => [r.weekday, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Disponibilidade</h1>
        <p className="mt-1 max-w-xl text-[14px] text-muted">
          Defina seus horários por dia da semana. Marque &ldquo;Fechado&rdquo; nos dias que não atende.
        </p>
      </div>

      <SaveForm action={saveAvailabilityWindows} successMessage="Disponibilidade salva." className="space-y-4">
        <Card variant="solid" padding="none" className="overflow-hidden">
          {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
            const r = byWd.get(weekday);
            const closed = r?.status === "CLOSED" || !r;
            const start = r && r.status !== "CLOSED" ? r.startTime : "09:00";
            const end = r && r.status !== "CLOSED" ? r.endTime : "22:00";
            return (
              <div key={weekday}
                className="flex flex-wrap items-center gap-4 border-b border-black/[0.06] px-5 py-4 last:border-0">
                {/* Day name */}
                <span className="w-20 text-[14px] font-semibold tracking-tight">{DAYS[weekday]}</span>

                {/* Closed toggle */}
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    name={`wd_${weekday}_closed`}
                    defaultChecked={closed}
                    className="h-4 w-4 accent-coral rounded"
                  />
                  <span className="text-muted">Fechado</span>
                </label>

                {/* Time selects */}
                <div className="flex items-center gap-2 ml-auto">
                  <Select
                    name={`wd_${weekday}_start`}
                    label="Início"
                    defaultValue={start}
                    options={timeSelectOptions}
                  />
                  <span className="mt-5 text-muted">–</span>
                  <Select
                    name={`wd_${weekday}_end`}
                    label="Fim"
                    defaultValue={end}
                    options={timeSelectOptions}
                  />
                </div>
              </div>
            );
          })}
        </Card>

        <Button type="submit" variant="coral" size="lg" className="uppercase tracking-wider">
          Salvar disponibilidade
        </Button>
      </SaveForm>
    </div>
  );
}

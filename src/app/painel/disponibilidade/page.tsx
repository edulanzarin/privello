import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveAvailabilityWindows } from "@/app/painel/_actions/provider-settings";

export const dynamic = "force-dynamic";

const labels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
        <h1 className="text-2xl font-bold tracking-tight">Disponibilidade</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Defina seus horários de atendimento por dia da semana. O cliente vê inícios de 30 em 30 minutos dentro da janela.
        </p>
      </div>

      <form action={saveAvailabilityWindows} className="space-y-4">
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Dia</th>
                <th className="px-4 py-3">Fechado</th>
                <th className="px-4 py-3">Início</th>
                <th className="px-4 py-3">Fim</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
                const r = byWd.get(weekday);
                const closed = r?.status === "CLOSED" || !r;
                const start  = r && r.status !== "CLOSED" ? r.startTime : "12:00";
                const end    = r && r.status !== "CLOSED" ? r.endTime   : "17:00";
                return (
                  <tr key={weekday} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{labels[weekday]}</td>
                    <td className="px-4 py-3">
                      <input type="checkbox" name={`wd_${weekday}_closed`} defaultChecked={closed} className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3">
                      <input name={`wd_${weekday}_start`} type="time" defaultValue={start} step={1800}
                        className="border border-line px-2 py-1.5 text-sm outline-none focus:border-foreground" />
                    </td>
                    <td className="px-4 py-3">
                      <input name={`wd_${weekday}_end`} type="time" defaultValue={end} step={1800}
                        className="border border-line px-2 py-1.5 text-sm outline-none focus:border-foreground" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="bg-coral px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-coral/90">
            Salvar disponibilidade
          </button>
          <Link href={`/solicitar/${profile.slug}`}
            className="border border-line bg-white px-6 py-3 text-xs font-semibold uppercase transition hover:border-foreground">
            Ver como cliente →
          </Link>
        </div>
      </form>
    </div>
  );
}

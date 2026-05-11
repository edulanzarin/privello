import Link from "next/link";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { saveAvailabilityWindows } from "@/app/painel/_actions/provider-settings";

export const dynamic = "force-dynamic";

const labels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function PainelDisponibilidadePage() {
  const slug = DEMO_PROVIDER_SLUG;
  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: { availabilityRules: true },
  });

  if (!profile) {
    return <p className="text-sm text-muted">Perfil demo não encontrado. Rode o seed.</p>;
  }

  const byWd = new Map(profile.availabilityRules.map((r) => [r.weekday, r]));

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Disponibilidade</p>
      <h1 className="mt-2 font-serif text-3xl">Períodos de atendimento.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Horários são salvos por dia da semana. No site público, o cliente vê apenas inícios de 30 em 30 minutos dentro
        da janela (ex.: 12:00–17:00). Em localhost, alterações aplicam ao perfil{" "}
        <strong className="text-foreground">{slug}</strong>.
      </p>

      <form action={saveAvailabilityWindows} className="mt-10 space-y-6">
        <input type="hidden" name="slug" value={slug} />
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
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
                const start = r && r.status !== "CLOSED" ? r.startTime : "12:00";
                const end = r && r.status !== "CLOSED" ? r.endTime : "17:00";
                return (
                  <tr key={weekday} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{labels[weekday]}</td>
                    <td className="px-4 py-3">
                      <input type="checkbox" name={`wd_${weekday}_closed`} defaultChecked={closed} className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`wd_${weekday}_start`}
                        type="time"
                        defaultValue={start}
                        step={1800}
                        className="border border-line px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        name={`wd_${weekday}_end`}
                        type="time"
                        defaultValue={end}
                        step={1800}
                        className="border border-line px-2 py-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4">
          <button type="submit" className="bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white">
            Salvar disponibilidade
          </button>
          <Link href={`/solicitar/${slug}`} className="border border-line bg-white px-6 py-3 text-xs font-semibold uppercase">
            Ver como cliente
          </Link>
        </div>
      </form>
    </>
  );
}

import { FinancialOrigin } from "@prisma/client";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import { formatBrl } from "@/lib/money";
import { getProfileBySlugForPainel, listFinancialRecordsForMonth } from "@/lib/queries";

export const dynamic = "force-dynamic";

function originBadge(origin: FinancialOrigin) {
  switch (origin) {
    case "SITE":
      return "bg-foreground text-white";
    case "WHATSAPP":
      return "bg-coral/15 text-coral";
    default:
      return "bg-black/10 text-muted";
  }
}

export default async function PainelFinanceiroPage() {
  const year = 2026;
  const month = 5;
  let rows: Awaited<ReturnType<typeof listFinancialRecordsForMonth>> = [];
  try {
    const p = await getProfileBySlugForPainel(DEMO_PROVIDER_SLUG);
    if (p) rows = await listFinancialRecordsForMonth(p.id, year, month);
  } catch {
    /* */
  }

  const total = rows.reduce((a, r) => a + r.amountBrl, 0);
  const paid = rows.filter((r) => !r.isNoShow).length;
  const noshow = rows.filter((r) => r.isNoShow).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
            Financeiro · maio {year}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
            Seu mês. <em className="not-italic text-muted">até aqui</em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex overflow-hidden rounded border border-line bg-white text-xs font-semibold">
            <span className="bg-foreground px-3 py-2 text-white">Maio</span>
            <span className="px-3 py-2 text-muted">Abril</span>
            <span className="px-3 py-2 text-muted">Março</span>
            <span className="px-3 py-2 text-muted">Ano</span>
          </div>
          <button type="button" className="border border-line bg-white px-3 py-2 text-xs">
            Exportar
          </button>
          <button type="button" className="bg-foreground px-3 py-2 text-xs text-white">
            Registrar encontro
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Faturamento · mai", formatBrl(15300), "↑ 22% vs abr"],
          ["Encontros realizados", "7", "meta: 12"],
          ["Ticket médio", formatBrl(2186), "↑ R$ 340"],
          ["Clientes recorrentes", "3", "43% do mês"],
        ].map(([t, v, s]) => (
          <div key={t} className="border border-line bg-white p-5 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t}</p>
            <p className="mt-2 text-2xl font-semibold">{v}</p>
            <p className="mt-1 text-xs font-medium text-success">{s}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-line bg-white p-6 shadow-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Faturamento por dia · maio</h2>
          <p className="mt-1 text-xs text-muted">{formatBrl(15300)} acumulado (ilustrativo)</p>
          <div className="mt-6 flex h-44 items-end gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col justify-end gap-0.5">
                <div className="h-[40%] w-full bg-foreground/90" />
                <div className="h-[25%] w-full bg-coral/80" />
                <div className="h-[15%] w-full bg-line" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted">
            <span>
              <span className="mr-1 inline-block h-2 w-2 bg-foreground" /> Via site (agendado)
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 bg-coral" /> Via WhatsApp
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 bg-line" /> Manual
            </span>
          </div>
        </div>
        <div className="border border-line bg-white p-6 shadow-sm">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Clientes do mês</h2>
          <p className="text-xs text-muted">Por faturamento</p>
          <ol className="mt-4 space-y-3 text-sm">
            {["Cliente R.M.", "Felipe R.", "Anônimo"].map((name, i) => (
              <li key={name} className="flex justify-between border-b border-line py-2">
                <span>
                  0{i + 1} · {name}
                </span>
                <span className="font-medium">{formatBrl(4420 - i * 800)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <span className="border-b-2 border-foreground pb-2">Todos ({rows.length})</span>
            <span className="text-muted">Via site</span>
            <span className="text-muted">Via WhatsApp</span>
          </div>
          <button type="button" className="text-xs underline">
            Filtrar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] font-semibold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.occurredAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{" "}
                    {r.occurredAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">{r.clientLabel}</td>
                  <td className="px-4 py-3">{r.durationLabel}</td>
                  <td className="px-4 py-3">{r.locationLabel}</td>
                  <td className="px-4 py-3">{r.paymentLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${originBadge(r.origin)}`}>
                      {r.origin}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {r.isNoShow ? (
                      <span className="text-coral">
                        {formatBrl(r.amountBrl)}
                        <span className="ml-2 text-[10px] uppercase">No-show</span>
                      </span>
                    ) : (
                      formatBrl(r.amountBrl)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-muted">
          Mostrando {rows.length} de {rows.length} deste mês · Total {formatBrl(total)} · {paid} pagos · {noshow}{" "}
          no-show
        </p>
      </div>
    </div>
  );
}

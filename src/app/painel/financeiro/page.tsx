import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBrl } from "@/lib/money";
import { listFinancialRecordsForMonth } from "@/lib/queries";
import { addFinancialRecord } from "@/app/painel/_actions/provider-settings";
import type { FinancialOrigin } from "@prisma/client";

export const dynamic = "force-dynamic";

function originBadge(origin: FinancialOrigin) {
  switch (origin) {
    case "SITE":      return "bg-foreground text-white";
    case "WHATSAPP":  return "bg-coral/15 text-coral";
    default:          return "bg-black/10 text-muted";
  }
}

export default async function PainelFinanceiroPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const rows = await listFinancialRecordsForMonth(profile.id, year, month);

  const total  = rows.reduce((a, r) => a + r.amountBrl, 0);
  const paid   = rows.filter((r) => !r.isNoShow).length;
  const noshow = rows.filter((r) => r.isNoShow).length;
  const avg    = paid > 0 ? Math.round(rows.filter((r) => !r.isNoShow).reduce((a, r) => a + r.amountBrl, 0) / paid) : 0;

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">Financeiro · {monthName} {year}</h1>
          <p className="mt-1 text-sm text-muted">Registros do mês atual.</p>
        </div>
        {/* Add record form — always visible, not inside details */}
        <div className="border border-line bg-white p-5 sm:w-96">
          <p className="text-xs font-bold uppercase tracking-wider mb-4">+ Registrar encontro</p>
          <form action={addFinancialRecord} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Cliente</label>
                <input name="clientLabel" required placeholder="Nome / iniciais"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Valor (R$)</label>
                <input name="amountBrl" type="number" required min={1} placeholder="500"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Duração</label>
                <select name="durationLabel" defaultValue="2 horas" className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground cursor-pointer bg-white">
                  <option value="30 minutos">30 minutos</option>
                  <option value="1 hora">1 hora</option>
                  <option value="1h30">1h30</option>
                  <option value="2 horas">2 horas</option>
                  <option value="3 horas">3 horas</option>
                  <option value="4 horas">4 horas</option>
                  <option value="Pernoite">Pernoite</option>
                  <option value="Diária">Diária</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Local</label>
                <select name="locationLabel" className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground cursor-pointer bg-white">
                  <option value="Local próprio">Local próprio</option>
                  <option value="A domicílio">A domicílio</option>
                  <option value="Motel / hotel">Motel / hotel</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Pagamento</label>
                <select name="paymentLabel" className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground cursor-pointer bg-white">
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Pix · Dinheiro">Pix · Dinheiro</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="isNoShow" className="h-4 w-4 accent-coral" />
                  No-show
                </label>
              </div>
            </div>
            <button type="submit" className="w-full bg-coral py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-coral/90 transition">
              Registrar
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Faturamento", formatBrl(total), monthName],
          ["Encontros realizados", String(paid), "este mês"],
          ["Ticket médio", avg > 0 ? formatBrl(avg) : "—", "por encontro"],
          ["No-shows", String(noshow), "este mês"],
        ].map(([t, v, s]) => (
          <div key={t} className="border border-line bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{v}</p>
            <p className="mt-1 text-xs text-muted">{s}</p>
          </div>
        ))}
      </div>

      {/* Records table */}
      <div className="border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Registros · {rows.length} encontros · {formatBrl(total)} total
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            Nenhum registro este mês. Use o botão acima para registrar um encontro.
          </p>
        ) : (
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
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {r.occurredAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{" "}
                      {r.occurredAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.clientLabel}</td>
                    <td className="px-4 py-3 text-muted">{r.durationLabel}</td>
                    <td className="px-4 py-3 text-muted">{r.locationLabel}</td>
                    <td className="px-4 py-3 text-muted">{r.paymentLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${originBadge(r.origin)}`}>
                        {r.origin}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {r.isNoShow ? (
                        <span className="text-coral">{formatBrl(r.amountBrl)} <span className="text-[10px]">no-show</span></span>
                      ) : formatBrl(r.amountBrl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

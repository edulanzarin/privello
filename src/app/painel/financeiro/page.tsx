import Link from "next/link";
import { redirect } from "next/navigation";
import { Diamond } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBrl } from "@/lib/money";
import { listFinancialRecordsForMonth } from "@/lib/queries";
import { addFinancialRecord } from "@/app/painel/_actions/provider-settings";
import { FinancialTable } from "./financial-table";

export const dynamic = "force-dynamic";

export default async function PainelFinanceiroPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, planTier: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  // ── Gate: só plano Ícone (PREMIUM) ────────────────────────────────────────
  if (profile.planTier !== "PREMIUM") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <Diamond className="h-10 w-10 text-coral" strokeWidth={1} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão financeira</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Disponível no plano <strong>Premium</strong>. Acompanhe faturamento, ticket médio, histórico
            completo e registre cada encontro com privacidade total.
          </p>
        </div>
        <Link
          href="/painel/plano"
          className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-coral/90 transition"
        >
          Fazer upgrade para Premium
        </Link>
        <p className="text-xs text-muted">Sem fidelidade. Cancele quando quiser.</p>
      </div>
    );
  }

  const now    = new Date();
  const year   = now.getFullYear();
  const month  = now.getMonth() + 1;

  const rows = await listFinancialRecordsForMonth(profile.id, year, month);

  const total  = rows.reduce((a, r) => a + r.amountBrl, 0);
  const paid   = rows.filter((r) => !r.isNoShow);
  const noshow = rows.filter((r) => r.isNoShow).length;
  const avg    = paid.length > 0 ? Math.round(paid.reduce((a, r) => a + r.amountBrl, 0) / paid.length) : 0;

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="space-y-8">
      {/* Header + form */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Financeiro</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight capitalize">
            {monthName} {year}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} {rows.length === 1 ? "registro" : "registros"} · apenas você vê isso
          </p>
        </div>

        {/* Add form */}
        <div className="border border-line bg-white p-5 xl:w-[420px] shrink-0">
          <p className="text-xs font-bold uppercase tracking-wider mb-4">+ Registrar encontro</p>
          <form action={addFinancialRecord} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Cliente</label>
                <input
                  name="clientLabel"
                  required
                  placeholder="Nome ou iniciais"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Valor (R$)</label>
                <input
                  name="amountBrl"
                  type="number"
                  required
                  min={1}
                  placeholder="500"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Duração</label>
                <select
                  name="durationLabel"
                  defaultValue="2 horas"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground cursor-pointer bg-white"
                >
                  <option>30 minutos</option>
                  <option>1 hora</option>
                  <option>1h30</option>
                  <option>2 horas</option>
                  <option>3 horas</option>
                  <option>4 horas</option>
                  <option>Pernoite</option>
                  <option>Diária</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Local</label>
                <select
                  name="locationLabel"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground cursor-pointer bg-white"
                >
                  <option>Local próprio</option>
                  <option>A domicílio</option>
                  <option>Motel / hotel</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-muted mb-1">Pagamento</label>
                <select
                  name="paymentLabel"
                  className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground cursor-pointer bg-white"
                >
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Cartão</option>
                  <option>Pix · Dinheiro</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="isNoShow" className="h-4 w-4 accent-coral" />
                  No-show
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-coral py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-coral/90 transition"
            >
              Registrar
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Faturamento", formatBrl(total), `em ${monthName}`],
          ["Encontros realizados", String(paid.length), "este mês"],
          ["Ticket médio", avg > 0 ? formatBrl(avg) : "—", "por encontro"],
          ["No-shows", String(noshow), "este mês"],
        ].map(([t, v, s]) => (
          <div key={t as string} className="border border-line bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{v}</p>
            <p className="mt-1 text-xs text-muted">{s}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-line bg-white">
        <div className="border-b border-line px-4 py-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Registros · {rows.length} {rows.length === 1 ? "encontro" : "encontros"} · {formatBrl(total)} total
          </p>
          <p className="text-[10px] text-muted">Passe o mouse para editar ou excluir</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Nenhum registro este mês. Use o formulário acima para registrar um encontro.
          </p>
        ) : (
          <FinancialTable rows={rows} />
        )}
      </div>
    </div>
  );
}

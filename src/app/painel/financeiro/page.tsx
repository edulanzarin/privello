/**
 * Página RSC — Painel do provider: gestão financeira (Premium-only).
 *
 * Rota: `/painel/financeiro`.
 * Tipo: Server Component (form de adicionar é server action).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`;
 *  feature-gate adicional: apenas plano `PREMIUM` (mostra paywall caso contrário).
 * Cache: `force-dynamic`.
 *
 * Visual v2 (Tahoe Sensual):
 * - `<Card variant="solid">` para form + tabela.
 * - `<Input>` / `<Select>` / `<Button>` v2 substituem chrome ad-hoc.
 * - Eyebrow uppercase tracking-wider + título Inter Bold tracking apertado.
 * - Paywall: ícone diamond rose + Button primary.
 *
 * Cross-refs:
 * - src/lib/services/financial.service.ts (listFinancialRecordsForMonth)
 * - src/app/painel/_actions/provider-settings.ts (addFinancialRecord)
 * - src/app/painel/financeiro/financial-table.tsx
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Diamond } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBrl } from "@/lib/money";
import { listFinancialRecordsForMonth } from "@/lib/services";
import { addFinancialRecord } from "@/app/painel/_actions/provider-settings";
import { FinancialTable } from "./financial-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";

export const dynamic = "force-dynamic";

export default async function PainelFinanceiroPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, planTier: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  // ── Gate: só plano Premium ──────────────────────────────────────────────
  if (profile.planTier !== "PREMIUM") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-soft">
          <Diamond className="h-8 w-8 text-rose" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
            Gestão financeira
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-md leading-relaxed text-ink-dim">
            Disponível no plano <strong className="text-ink">Premium</strong>.
            Acompanhe faturamento, ticket médio, histórico completo e registre
            cada encontro com privacidade total.
          </p>
        </div>
        <Button href="/painel/plano" variant="primary" size="lg">
          Fazer upgrade para Premium
        </Button>
        <p className="text-sm text-ink-dim">
          Sem fidelidade. Cancele quando quiser.
        </p>
      </div>
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const rows = await listFinancialRecordsForMonth(profile.id, year, month);

  const total = rows.reduce((a, r) => a + r.amountBrl, 0);
  const paid = rows.filter((r) => !r.isNoShow);
  const noshow = rows.filter((r) => r.isNoShow).length;
  const avg =
    paid.length > 0
      ? Math.round(paid.reduce((a, r) => a + r.amountBrl, 0) / paid.length)
      : 0;

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="space-y-8">
      {/* Header + form */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Financeiro
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.025em] text-ink capitalize sm:text-4xl">
            {monthName} {year}
          </h1>
          <p className="mt-2 text-md text-ink-dim">
            {rows.length} {rows.length === 1 ? "registro" : "registros"} ·
            apenas você vê isso
          </p>
        </div>

        {/* Add form */}
        <Card variant="solid" padding="md" className="shrink-0 xl:w-[420px]">
          <p className="mb-4 text-md font-semibold tracking-[-0.011em] text-ink">
            + Registrar encontro
          </p>
          <form action={addFinancialRecord} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  name="clientLabel"
                  label="Cliente"
                  placeholder="Nome ou iniciais"
                  required
                />
              </div>
              <div>
                <Input
                  name="amountBrl"
                  type="number"
                  label="Valor (R$)"
                  placeholder="500"
                  min={1}
                  required
                />
              </div>
              <div>
                <Select
                  name="durationLabel"
                  label="Duração"
                  defaultValue="2 horas"
                  options={[
                    { value: "30 minutos", label: "30 minutos" },
                    { value: "1 hora", label: "1 hora" },
                    { value: "1h30", label: "1h30" },
                    { value: "2 horas", label: "2 horas" },
                    { value: "3 horas", label: "3 horas" },
                    { value: "4 horas", label: "4 horas" },
                    { value: "Pernoite", label: "Pernoite" },
                    { value: "Diária", label: "Diária" },
                  ]}
                />
              </div>
              <div>
                <Select
                  name="locationLabel"
                  label="Local"
                  options={[
                    { value: "Local próprio", label: "Local próprio" },
                    { value: "A domicílio", label: "A domicílio" },
                    { value: "Motel / hotel", label: "Motel / hotel" },
                  ]}
                />
              </div>
              <div>
                <Select
                  name="paymentLabel"
                  label="Pagamento"
                  options={[
                    { value: "Pix", label: "Pix" },
                    { value: "Dinheiro", label: "Dinheiro" },
                    { value: "Cartão", label: "Cartão" },
                    { value: "Pix · Dinheiro", label: "Pix · Dinheiro" },
                  ]}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-base text-ink">
                  <input
                    type="checkbox"
                    name="isNoShow"
                    className="h-4 w-4 rounded accent-rose"
                  />
                  No-show
                </label>
              </div>
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Registrar
            </Button>
          </form>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento"
          value={formatBrl(total)}
          subtitle={`em ${monthName}`}
        />
        <StatCard
          label="Encontros realizados"
          value={String(paid.length)}
          subtitle="este mês"
        />
        <StatCard
          label="Ticket médio"
          value={avg > 0 ? formatBrl(avg) : "—"}
          subtitle="por encontro"
        />
        <StatCard
          label="No-shows"
          value={String(noshow)}
          subtitle="este mês"
        />
      </div>

      {/* Table */}
      <Card variant="solid" padding="none">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Registros · {rows.length}{" "}
            {rows.length === 1 ? "encontro" : "encontros"} · {formatBrl(total)} total
          </p>
          <p className="text-xs text-ink-faint">
            Passe o mouse para editar ou excluir
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              title="Nenhum registro este mês"
              description="Use o formulário acima para registrar um encontro."
            />
          </div>
        ) : (
          <FinancialTable rows={rows} />
        )}
      </Card>
    </div>
  );
}

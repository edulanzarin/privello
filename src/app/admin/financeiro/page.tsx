/**
 * Página RSC — Admin financeiro (MRR, planos, assinaturas).
 *
 * Rota: `/admin/financeiro`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`).
 * Cache: `force-dynamic` (snapshot por request).
 *
 * Renderiza tiles de MRR estimado e por plano via `KPICard`, contadores de
 * assinaturas via `KPICard`, e a lista de assinaturas ativas via `Table`
 * com `TD numeric` nas colunas de valor.
 *
 * Spec: .kiro/specs/redesign-macos-system/tasks.md > Task 15.1
 * (Requirement 10.4 em requirements.md).
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx (gate ADMIN/MODERATOR)
 * - src/components/admin/admin-shell.tsx
 * - src/components/ui/kpi-card.tsx
 * - src/components/ui/table.tsx
 * - src/lib/prisma.ts
 */
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/ui/kpi-card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 39 (admin financeiro receita por plano).
export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = { ESSENCIAL: 39.90, DESTAQUE: 89, PREMIUM: 189 };
const PLAN_LABELS: Record<string, string> = { ESSENCIAL: "Basic", DESTAQUE: "Plus", PREMIUM: "Premium" };
const SUBSCRIBER_PRICE_BRL = 19.90;
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function AdminFinanceiroPage() {
  const now = new Date();

  const [planStats, activeSubscriptions, expiredSubs, cancelledSubs] = await Promise.all([
    prisma.profile.groupBy({ by: ["planTier"], _count: true }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscription.count({ where: { status: "CANCELLED" } }),
  ]);

  const providerMRR = planStats.reduce((sum, g) => sum + g._count * (PLAN_PRICES[g.planTier] ?? 0), 0);
  const subMRR = activeSubscriptions.length * SUBSCRIBER_PRICE_BRL;
  const totalMRR = providerMRR + subMRR;
  const totalProviderProfiles = planStats.reduce((s, g) => s + g._count, 0);

  return (
    <AdminShell>
      <h1 className="mb-4 font-bold text-lg">Financeiro</h1>

      {/* MRR — tiles agregados (Req 10.4) */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KPICard
          label="MRR Total estimado"
          value={fmt(totalMRR)}
          subtitle="receita recorrente/mês"
        />
        <KPICard
          label="Planos de acompanhantes"
          value={fmt(providerMRR)}
          subtitle={`${totalProviderProfiles} perfis ativos`}
        />
        <KPICard
          label="Assinaturas de clientes"
          value={fmt(subMRR)}
          subtitle={`${activeSubscriptions.length} assinantes ativos`}
        />
      </div>

      {/* Breakdown por plano de acompanhante (Req 10.4) */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {planStats.map((g) => (
          <KPICard
            key={g.planTier}
            label={PLAN_LABELS[g.planTier] ?? g.planTier}
            value={`${g._count} perfis`}
            subtitle={`${fmt(g._count * (PLAN_PRICES[g.planTier] ?? 0))}/mês`}
          />
        ))}
      </div>

      {/* Contadores de assinaturas */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <KPICard label="Assinantes ativos" value={activeSubscriptions.length} />
        <KPICard label="Expiradas" value={expiredSubs} />
        <KPICard label="Canceladas" value={cancelledSubs} />
      </div>

      {/* Lista de assinantes ativos recentes (Req 10.4) */}
      {activeSubscriptions.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Assinantes ativos recentes
          </h2>
          <Table>
            <THead>
              <TR hover={false}>
                <TH>Usuário</TH>
                <TH>Email</TH>
                <TH>Status</TH>
                <TH>Expira em</TH>
                <TH align="right">Valor</TH>
              </TR>
            </THead>
            <tbody>
              {activeSubscriptions.map((s) => (
                <TR key={s.id}>
                  <TD className="text-xs font-medium">{s.user.name ?? "—"}</TD>
                  <TD className="text-xs text-ink-dim">{s.user.email}</TD>
                  <TD>
                    <Badge variant="success">Ativa</Badge>
                  </TD>
                  <TD className="text-xs text-ink-dim">
                    {s.expiresAt.toLocaleDateString("pt-BR")}
                  </TD>
                  <TD numeric className="text-xs font-semibold text-success">
                    {fmt(SUBSCRIBER_PRICE_BRL)}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </section>
      )}

      <p className="mt-6 text-xs text-ink-dim">
        * Valores estimados. Integração com Mercado Pago necessária para dados reais de pagamento.
      </p>
    </AdminShell>
  );
}

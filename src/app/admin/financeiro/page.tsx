/**
 * Página RSC — Admin financeiro (MRR, planos, assinaturas).
 *
 * Rota: `/admin/financeiro`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`).
 * Cache: `force-dynamic` (snapshot por request).
 *
 * Renderiza KPIs de MRR estimado, breakdown por plano de acompanhante e lista
 * de assinaturas de clientes ativas/expiradas/canceladas.
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx (gate ADMIN/MODERATOR)
 * - src/components/admin/admin-shell.tsx
 * - src/lib/prisma.ts
 */
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 39 (admin financeiro receita por plano).
export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = { ESSENCIAL: 39.90, DESTAQUE: 89, PREMIUM: 189 };
const PLAN_LABELS: Record<string, string> = { ESSENCIAL: "Basic", DESTAQUE: "Plus", PREMIUM: "Premium" };
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
  const subMRR = activeSubscriptions.length * 19.90;
  const totalMRR = providerMRR + subMRR;

  return (
    <AdminShell>
      <h1 className="mb-4 font-bold text-lg">Financeiro</h1>

      {/* MRR Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "MRR Total estimado", value: fmt(totalMRR), sub: "receita recorrente/mês" },
          { label: "Planos de acompanhantes", value: fmt(providerMRR), sub: `${planStats.reduce((s, g) => s + g._count, 0)} perfis ativos` },
          { label: "Assinaturas de clientes", value: fmt(subMRR), sub: `${activeSubscriptions.length} assinantes ativos` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded border border-line bg-white p-4 shadow-sm">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-2xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {planStats.map((g) => (
          <div key={g.planTier} className="rounded border border-line bg-white p-4 shadow-sm">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted">
              {PLAN_LABELS[g.planTier] ?? g.planTier}
            </p>
            <p className="mt-1 text-xl font-bold">{g._count} perfis</p>
            <p className="text-xs text-muted">{fmt(g._count * (PLAN_PRICES[g.planTier] ?? 0))}/mês</p>
          </div>
        ))}
      </div>

      {/* Subscription stats */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Assinantes ativos", value: activeSubscriptions.length },
          { label: "Expiradas", value: expiredSubs },
          { label: "Canceladas", value: cancelledSubs },
        ].map(({ label, value }) => (
          <div key={label} className="rounded border border-line bg-white p-4 shadow-sm">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent subscribers */}
      {activeSubscriptions.length > 0 && (
        <div className="mt-5 rounded border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted">Assinantes ativos recentes</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-2xs font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5">Usuário</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Expira em</th>
                <th className="px-4 py-2.5">Valor</th>
              </tr>
            </thead>
            <tbody>
              {activeSubscriptions.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-line/20">
                  <td className="px-4 py-2 text-xs font-medium">{s.user.name ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-muted">{s.user.email}</td>
                  <td className="px-4 py-2 text-xs text-muted">{s.expiresAt.toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2 text-xs font-semibold text-success">R$ 19,90</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        * Valores estimados. Integração com Mercado Pago necessária para dados reais de pagamento.
      </p>
    </AdminShell>
  );
}

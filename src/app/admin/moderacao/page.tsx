/**
 * Página RSC — Dashboard de moderação (KPIs, charts, fila de verificação).
 *
 * Rota: `/admin/moderacao`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`).
 * Cache: `force-dynamic` (KPIs em tempo real e fila por searchParams).
 *
 * Página inicial do admin: KPIs (perfis, verificadas, pendentes, suporte, MRR),
 * charts de séries temporais e fila paginada de `VerificationCase` com filtros
 * por status, cidade, busca e ordenação.
 *
 * Refatorado conforme spec `redesign-macos-system` (Task 12.1):
 * - 6 KPIs ad-hoc → `<KPICard>`.
 * - Tabs inline → `<Tabs variant="pills" size="sm">`.
 * - Tabela queue → `<Table>/<THead>/<TR>/<TH>/<TD>`.
 * - `STATUS_COLORS` hardcoded → `<Badge variant={statusToBadgeVariant(...)}>`.
 * - Botão "Buscar" → `<Button size="sm" variant="primary">`.
 * - `<input>` cru de busca → `<Input>`.
 * - Removidas todas as classes Tailwind cruas de paleta (zinc/amber/sky/emerald).
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx
 * - src/components/admin/admin-shell.tsx
 * - src/components/admin/admin-charts.tsx
 * - src/components/admin/quick-actions.tsx
 * - src/components/admin/admin-city-filter.tsx
 * - src/components/ui/{kpi-card,tabs,table,badge,button,input}.tsx
 * - src/lib/ui/status.ts (statusToBadgeVariant)
 */
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProfilesChart, MediaChart, SubscriptionsChart, ReelsChart } from "@/components/admin/admin-charts";
import { QuickActions } from "@/components/admin/quick-actions";
import { AdminCityFilter } from "@/components/admin/admin-city-filter";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/ui/kpi-card";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { statusToBadgeVariant } from "@/lib/ui/status";
import { BadgeCheck, Clock, Users, ShieldCheck, Play, TrendingUp, AlertCircle } from "lucide-react";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 36 (admin moderação tempo real).
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function get(raw: Record<string, string | string[] | undefined>, key: string) {
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
}

function groupByDay(dates: Date[], days = 30): { date: string; count: number }[] {
  const now = new Date();
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), 0);
  }
  for (const date of dates) {
    const key = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

function groupByWeek(dates: Date[], weeks = 8): { week: string; count: number }[] {
  const now = new Date();
  const result: { week: string; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7 - 6);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const count = dates.filter((d) => d >= start && d <= end).length;
    result.push({
      week: `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
      count,
    });
  }
  return result;
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novo",
  REVISAO: "Em revisão",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminModeracaoPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const statusFilter = get(raw, "status") ?? "pending"; // pending | all | NOVO | REVISAO | APROVADO | REJEITADO
  const searchQ = get(raw, "q")?.trim() ?? "";
  const cityFilter = get(raw, "city") ?? "";
  const sortFilter = get(raw, "sort") ?? "oldest"; // oldest | newest
  const pageNum = Math.max(1, parseInt(get(raw, "p") ?? "1", 10));
  const PAGE_SIZE = 20;

  const now = new Date();
  // Page é dinâmica (`force-dynamic`); snapshot do timestamp para uso no JSX.
  const nowMs = now.getTime();
  const days30 = new Date(now); days30.setDate(days30.getDate() - 30);
  const weeks8 = new Date(now); weeks8.setDate(weeks8.getDate() - 56);

  // ── Parallel data fetching ────────────────────────────────────────────────
  const [
    totalProfiles,
    verifiedProfiles,
    pendingCount,
    activeSubscriptions,
    // Time-series data
    recentProfiles,
    recentMedia,
    recentReels,
    recentSubs,
    // Cities for filter
    cities,
    // Stats by plan
    planStats,
    // Open support tickets
    openTickets,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { isVerified: true } }),
    prisma.verificationCase.count({ where: { status: { in: ["NOVO", "REVISAO"] } } }),
    prisma.subscription.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
    prisma.profile.findMany({ where: { createdAt: { gte: days30 } }, select: { createdAt: true } }),
    prisma.media.findMany({ where: { createdAt: { gte: days30 }, mediaType: { not: "REEL" } }, select: { createdAt: true } }),
    prisma.media.findMany({ where: { createdAt: { gte: days30 }, mediaType: "REEL" }, select: { createdAt: true } }),
    prisma.subscription.findMany({ where: { createdAt: { gte: weeks8 }, status: "ACTIVE" }, select: { createdAt: true } }),
    prisma.city.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.profile.groupBy({ by: ["planTier"], _count: true }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  // MRR estimate
  const PLAN_PRICES: Record<string, number> = { ESSENCIAL: 39.90, DESTAQUE: 89, PREMIUM: 189 };
  const providerMRR = planStats.reduce((sum, g) => sum + g._count * (PLAN_PRICES[g.planTier] ?? 0), 0);
  const subMRR = activeSubscriptions * 19.90;
  const totalMRR = providerMRR + subMRR;

  // Chart data
  const profilesChart = groupByDay(recentProfiles.map((p) => p.createdAt));
  const mediaChart = groupByDay(recentMedia.map((m) => m.createdAt));
  const reelsChart = groupByDay(recentReels.map((m) => m.createdAt));
  const subsChart = groupByWeek(recentSubs.map((s) => s.createdAt));

  // ── Verification queue ──────────────────────────────────────────────────
  const queueWhere: Prisma.VerificationCaseWhereInput = {};

  if (statusFilter === "pending") {
    queueWhere.status = { in: ["NOVO", "REVISAO"] };
  } else if (["NOVO", "REVISAO", "APROVADO", "REJEITADO"].includes(statusFilter)) {
    queueWhere.status = statusFilter as "NOVO" | "REVISAO" | "APROVADO" | "REJEITADO";
  }

  const profileWhere: Prisma.ProfileWhereInput = {};
  if (searchQ) profileWhere.displayName = { contains: searchQ, mode: "insensitive" };
  if (cityFilter) profileWhere.city = { slug: cityFilter };
  if (searchQ || cityFilter) queueWhere.profile = profileWhere;

  const [queueRows, queueTotal] = await Promise.all([
    prisma.verificationCase.findMany({
      where: queueWhere,
      orderBy: sortFilter === "newest"
        ? { createdAt: "desc" }
        : { waitingSince: "asc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        profile: {
          select: {
            slug: true, displayName: true, age: true,
            city: { select: { name: true } },
            district: { select: { name: true } },
            media: { where: { isCover: true }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.verificationCase.count({ where: queueWhere }),
  ]);

  const totalPages = Math.ceil(queueTotal / PAGE_SIZE);

  function buildQueueHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merge = { status: statusFilter, q: searchQ, city: cityFilter, sort: sortFilter, p: String(pageNum), ...overrides };
    for (const [k, v] of Object.entries(merge)) {
      if (v) p.set(k, v);
    }
    return `/admin/moderacao?${p.toString()}`;
  }

  const kpis = [
    { label: "Perfis ativos", value: totalProfiles.toLocaleString("pt-BR"), icon: Users, sub: `${verifiedProfiles} verificadas` },
    { label: "Verificadas", value: verifiedProfiles.toLocaleString("pt-BR"), icon: BadgeCheck, sub: `${totalProfiles > 0 ? Math.round(verifiedProfiles / totalProfiles * 100) : 0}% do total` },
    { label: "Pendentes review", value: pendingCount.toLocaleString("pt-BR"), icon: ShieldCheck, sub: "aguardando revisão", alert: pendingCount > 5 },
    { label: "Assinantes ativos", value: activeSubscriptions.toLocaleString("pt-BR"), icon: TrendingUp, sub: "clientes com acesso" },
    { label: "Suporte aberto", value: openTickets.toLocaleString("pt-BR"), icon: AlertCircle, sub: "tickets pendentes", alert: openTickets > 0 },
    { label: "MRR estimado", value: `R$ ${totalMRR.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: Play, sub: "receita recorrente/mês" },
  ];

  // Tabs de status — navegação por URL (cada item gera href via buildQueueHref).
  const tabItems: TabItem[] = [
    { key: "pending", label: "Pendentes", href: buildQueueHref({ status: "pending", p: "1" }) },
    { key: "all", label: "Todos", href: buildQueueHref({ status: "all", p: "1" }) },
    { key: "NOVO", label: "Novos", href: buildQueueHref({ status: "NOVO", p: "1" }) },
    { key: "REVISAO", label: "Em revisão", href: buildQueueHref({ status: "REVISAO", p: "1" }) },
    { key: "APROVADO", label: "Aprovados", href: buildQueueHref({ status: "APROVADO", p: "1" }) },
    { key: "REJEITADO", label: "Rejeitados", href: buildQueueHref({ status: "REJEITADO", p: "1" }) },
  ];

  return (
    <AdminShell>
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, icon, sub, alert }) => (
          <KPICard
            key={label}
            label={label}
            value={value}
            icon={icon}
            subtitle={sub}
            alert={alert}
          />
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProfilesChart data={profilesChart} />
        <MediaChart data={mediaChart} />
        <ReelsChart data={reelsChart} />
        <SubscriptionsChart data={subsChart} />
      </div>

      {/* ── Verification queue ──────────────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        {/* Header: título, busca, filtros, tabs */}
        <Card variant="solid" padding="none">
          <div className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Fila de verificação</h2>
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <form method="get" action="/admin/moderacao" className="flex items-center gap-2">
                  {statusFilter !== "pending" && <input type="hidden" name="status" value={statusFilter} />}
                  {cityFilter && <input type="hidden" name="city" value={cityFilter} />}
                  {sortFilter !== "oldest" && <input type="hidden" name="sort" value={sortFilter} />}
                  <Input
                    name="q"
                    defaultValue={searchQ}
                    placeholder="Buscar por nome…"
                    className="w-40 px-2.5 py-1.5 text-xs"
                  />
                  <Button type="submit" size="sm" variant="primary">
                    Buscar
                  </Button>
                </form>

                {/* City filter */}
                <AdminCityFilter
                  cities={cities}
                  statusFilter={statusFilter}
                  searchQ={searchQ}
                  sortFilter={sortFilter}
                  cityFilter={cityFilter}
                />

                {/* Sort */}
                <Link
                  href={buildQueueHref({ sort: sortFilter === "oldest" ? "newest" : "oldest", p: "1" })}
                  className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:border-foreground/30 hover:text-foreground transition"
                >
                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                  {sortFilter === "oldest" ? "Mais antigos primeiro" : "Mais recentes primeiro"}
                </Link>
              </div>
            </div>

            {/* Status tabs */}
            <div className="mt-3">
              <Tabs items={tabItems} activeKey={statusFilter} variant="pills" size="sm" />
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Table minWidth={700}>
          <THead>
            <TR hover={false}>
              <TH>Foto</TH>
              <TH>Nome · cidade</TH>
              <TH>Docs</TH>
              <TH>Status</TH>
              <TH>Aguardando</TH>
              <TH align="right">Ações</TH>
            </TR>
          </THead>
          <tbody>
            {queueRows.length === 0 ? (
              <TR hover={false}>
                <TD colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                  Nenhum registro encontrado.
                </TD>
              </TR>
            ) : (
              queueRows.map((row) => {
                const thumb = row.profile.media[0]?.url;
                const waitMin = Math.max(1, Math.floor((nowMs - row.waitingSince.getTime()) / 60000));
                const waitLabel = waitMin < 60
                  ? `${waitMin}m`
                  : waitMin < 1440
                    ? `${Math.floor(waitMin / 60)}h`
                    : `${Math.floor(waitMin / 1440)}d`;
                const hasDocs = !!(row.documentFrontUrl || row.documentBackUrl || row.selfieUrl);

                return (
                  <TR key={row.id}>
                    <TD>
                      <div className="relative h-10 w-8 overflow-hidden rounded bg-line">
                        {thumb && <Image src={thumb} alt="" fill className="object-cover" sizes="32px" />}
                      </div>
                    </TD>
                    <TD>
                      <p className="font-semibold leading-tight">{row.profile.displayName}, {row.profile.age}</p>
                      <p className="text-xs text-muted">
                        {row.profile.city.name}{row.profile.district ? ` · ${row.profile.district.name}` : ""}
                      </p>
                    </TD>
                    <TD>
                      {hasDocs ? (
                        <div className="flex gap-1">
                          {[row.documentFrontUrl, row.documentBackUrl, row.selfieUrl].map((url, i) =>
                            url ? (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <div className="relative h-8 w-6 overflow-hidden rounded border border-line bg-line">
                                  <Image src={url} alt="" fill className="object-cover" sizes="24px" />
                                </div>
                              </a>
                            ) : (
                              <div key={i} className="h-8 w-6 rounded border border-dashed border-line bg-line/50" />
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted/60">Sem docs</span>
                      )}
                    </TD>
                    <TD>
                      <Badge variant={statusToBadgeVariant(row.status)}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-xs text-muted">{waitLabel}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        {(row.status === "NOVO" || row.status === "REVISAO") && (
                          <QuickActions caseId={row.id} />
                        )}
                        <Link
                          href={`/admin/verificacoes/${row.id}`}
                          className="rounded border border-line px-2 py-1 text-2xs font-bold uppercase text-muted hover:border-foreground/30 hover:text-foreground transition"
                        >
                          Detalhe
                        </Link>
                        <Link
                          href={`/p/${row.profile.slug}`}
                          target="_blank"
                          className="rounded border border-line px-2 py-1 text-2xs font-bold uppercase text-muted hover:border-foreground/30 hover:text-foreground transition"
                        >
                          Perfil ↗
                        </Link>
                      </div>
                    </TD>
                  </TR>
                );
              })
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 ? (
          <Card variant="solid" padding="none">
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
              <span>{queueTotal} resultado{queueTotal !== 1 ? "s" : ""}</span>
              <div className="flex gap-1">
                {pageNum > 1 && (
                  <Link
                    href={buildQueueHref({ p: String(pageNum - 1) })}
                    className="rounded border border-line px-2.5 py-1 hover:bg-line transition"
                  >
                    ←
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => Math.abs(n - pageNum) <= 2)
                  .map((n) => (
                    <Link
                      key={n}
                      href={buildQueueHref({ p: String(n) })}
                      className={`rounded border px-2.5 py-1 transition ${n === pageNum ? "border-foreground bg-foreground text-white" : "border-line hover:bg-line"}`}
                    >
                      {n}
                    </Link>
                  ))}
                {pageNum < totalPages && (
                  <Link
                    href={buildQueueHref({ p: String(pageNum + 1) })}
                    className="rounded border border-line px-2.5 py-1 hover:bg-line transition"
                  >
                    →
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ) : queueRows.length > 0 ? (
          <Card variant="solid" padding="none">
            <div className="px-4 py-2 text-right text-xs text-muted">
              {queueTotal} resultado{queueTotal !== 1 ? "s" : ""}
            </div>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  );
}

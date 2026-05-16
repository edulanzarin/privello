import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProfilesChart, MediaChart, SubscriptionsChart, ReelsChart } from "@/components/admin/admin-charts";
import { QuickActions } from "@/components/admin/quick-actions";
import { AdminCityFilter } from "@/components/admin/admin-city-filter";
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

const STATUS_COLORS: Record<string, string> = {
  NOVO: "bg-sky-100 text-sky-800",
  REVISAO: "bg-amber-100 text-amber-800",
  APROVADO: "bg-emerald-100 text-emerald-800",
  REJEITADO: "bg-zinc-200 text-zinc-700",
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

  const TABS = [
    { key: "pending", label: "Pendentes" },
    { key: "all", label: "Todos" },
    { key: "NOVO", label: "Novos" },
    { key: "REVISAO", label: "Em revisão" },
    { key: "APROVADO", label: "Aprovados" },
    { key: "REJEITADO", label: "Rejeitados" },
  ];

  return (
    <AdminShell>
      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, icon: Icon, sub, alert }) => (
          <div key={label} className={`rounded border bg-white p-3 shadow-sm ${alert ? "border-amber-300" : "border-line"}`}>
            <div className="flex items-center justify-between">
              <p className="text-2xs font-bold uppercase tracking-wider text-muted">{label}</p>
              <Icon className={`h-3.5 w-3.5 ${alert ? "text-amber-500" : "text-muted"}`} strokeWidth={1.5} />
            </div>
            <p className="mt-1.5 text-xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-2xs text-muted">{sub}</p>
          </div>
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
      <div className="mt-6 rounded border border-line bg-white shadow-sm">
        {/* Queue header */}
        <div className="border-b border-line px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Fila de verificação</h2>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <form method="get" action="/admin/moderacao" className="flex gap-1.5">
                {statusFilter !== "pending" && <input type="hidden" name="status" value={statusFilter} />}
                {cityFilter && <input type="hidden" name="city" value={cityFilter} />}
                {sortFilter !== "oldest" && <input type="hidden" name="sort" value={sortFilter} />}
                <input
                  name="q"
                  defaultValue={searchQ}
                  placeholder="Buscar por nome…"
                  className="w-40 rounded-md border border-black/10 px-2.5 py-1.5 text-xs outline-none hover:border-black/20 focus:border-blue transition-all"
                />
                <button type="submit" className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-white hover:bg-foreground/80 active:scale-[0.97] transition">
                  Buscar
                </button>
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
                className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-xs text-muted hover:border-foreground/30 hover:text-foreground transition"
              >
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                {sortFilter === "oldest" ? "Mais antigos primeiro" : "Mais recentes primeiro"}
              </Link>
            </div>
          </div>

          {/* Status tabs */}
          <div className="mt-3 flex flex-wrap gap-1">
            {TABS.map(({ key, label }) => (
              <Link
                key={key}
                href={buildQueueHref({ status: key, p: "1" })}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${statusFilter === key
                  ? "bg-foreground text-white"
                  : "bg-line text-muted hover:bg-line/70 hover:text-foreground"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-2xs font-semibold uppercase tracking-wider text-muted">
                <th className="px-3 py-2.5">Foto</th>
                <th className="px-3 py-2.5">Nome · cidade</th>
                <th className="px-3 py-2.5">Docs</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Aguardando</th>
                <th className="px-3 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {queueRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Nenhum registro encontrado.
                  </td>
                </tr>
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
                    <tr key={row.id} className="border-b border-line last:border-0 hover:bg-line/20 transition">
                      <td className="px-3 py-2">
                        <div className="relative h-10 w-8 overflow-hidden rounded bg-line">
                          {thumb && <Image src={thumb} alt="" fill className="object-cover" sizes="32px" />}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-semibold leading-tight">{row.profile.displayName}, {row.profile.age}</p>
                        <p className="text-xs text-muted">
                          {row.profile.city.name}{row.profile.district ? ` · ${row.profile.district.name}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2">
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
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-2xs font-bold uppercase ${STATUS_COLORS[row.status] ?? "bg-line text-muted"}`}>
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-muted">{waitLabel}</td>
                      <td className="px-3 py-2">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
            <span>{queueTotal} resultado{queueTotal !== 1 ? "s" : ""}</span>
            <div className="flex gap-1">
              {pageNum > 1 && (
                <Link href={buildQueueHref({ p: String(pageNum - 1) })} className="border border-line px-2.5 py-1 hover:bg-line transition">
                  ←
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => Math.abs(n - pageNum) <= 2)
                .map((n) => (
                  <Link
                    key={n}
                    href={buildQueueHref({ p: String(n) })}
                    className={`border px-2.5 py-1 transition ${n === pageNum ? "border-foreground bg-foreground text-white" : "border-line hover:bg-line"}`}
                  >
                    {n}
                  </Link>
                ))}
              {pageNum < totalPages && (
                <Link href={buildQueueHref({ p: String(pageNum + 1) })} className="border border-line px-2.5 py-1 hover:bg-line transition">
                  →
                </Link>
              )}
            </div>
          </div>
        )}
        {totalPages <= 1 && queueRows.length > 0 && (
          <div className="border-t border-line px-4 py-2 text-right text-xs text-muted">
            {queueTotal} resultado{queueTotal !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

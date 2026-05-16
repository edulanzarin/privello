import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Heart, TrendingUp, Zap, ArrowUpRight, AlertCircle, Ban } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listFinancialRecordsForMonth } from "@/lib/queries";
import { formatBrl } from "@/lib/money";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 24 (painel home autenticado).
export const dynamic = "force-dynamic";

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, color = "#ff375f" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const n = data.length;
  const slotW = 100 / n;
  const gap = Math.max(slotW * 0.18, 0.8);
  return (
    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = v > 0 ? Math.max((v / max) * 36, 2) : 1.5;
        return (
          <rect
            key={i}
            x={i * slotW + gap / 2}
            y={40 - h}
            width={slotW - gap}
            height={h}
            fill={color}
            opacity={v === 0 ? 0.12 : 0.85}
            rx={0.8}
          />
        );
      })}
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#86868b" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${40 - (v / max) * 36}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 40" className="w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function PainelOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/painel");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { city: true, _count: { select: { warnings: true } } },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const [financialRows, favRows] = await Promise.all([
    listFinancialRecordsForMonth(profile.id, year, month),
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Favorite" WHERE "profileId" = ${profile.id}`,
  ]);

  const favoritesCount = Number(favRows[0]?.count ?? 0);
  const hasPlan = profile.planExpiresAt != null && new Date(profile.planExpiresAt) > new Date();
  const viewsPeriod = (profile as Record<string, unknown>).viewsCurrentPeriod as number ?? 0;
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();

  // Financial stats
  const totalMonth = financialRows.reduce((a, r) => a + r.amountBrl, 0);
  const paidRows = financialRows.filter((r) => !r.isNoShow);
  const avgTicket = paidRows.length > 0 ? Math.round(paidRows.reduce((a, r) => a + r.amountBrl, 0) / paidRows.length) : 0;

  // Revenue by day (last 14 days)
  const revenueByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(today - 13 + i);
    const dayStr = d.toDateString();
    return financialRows
      .filter((r) => new Date(r.occurredAt).toDateString() === dayStr && !r.isNoShow)
      .reduce((a, r) => a + r.amountBrl, 0);
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  const isIncomplete = !profile.bio || profile.priceHour === 0 || !profile.whatsappPhone;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}, {profile.displayName}<span className="text-coral">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/p/${profile.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-[7px] text-sm font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.97]">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ver perfil
          </Link>
        </div>
      </div>

      {/* ── No plan banner ── */}
      {!profile.isSuspended && !hasPlan && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-base font-semibold text-amber-800">Perfil desabilitado</p>
              <p className="mt-0.5 text-sm text-amber-700">
                Você não aparece nas buscas enquanto não tiver um plano ativo.
              </p>
            </div>
          </div>
          <a
            href="/painel/plano"
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-[0.97]"
          >
            Ativar plano
          </a>
        </div>
      )}

      {/* ── Suspension banner ── */}
      {profile.isSuspended && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/50 bg-red-50/80 px-5 py-4 backdrop-blur-sm">
          <Ban className="h-5 w-5 shrink-0 text-red-600 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="font-bold text-sm text-red-700">Conta suspensa</p>
            <p className="mt-0.5 text-xs text-red-600 leading-relaxed">
              Seu perfil está invisível e inacessível para visitantes.
              {profile.suspensionNote && <> Motivo: <em>{profile.suspensionNote}</em></>}
              {" "}Entre em contato com o suporte para contestar.
            </p>
          </div>
        </div>
      )}

      {/* ── Warning notice ── */}
      {!profile.isSuspended && profile._count.warnings > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-300/50 bg-yellow-50/80 px-5 py-3 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-yellow-600" strokeWidth={1.5} />
          <p className="text-xs text-yellow-700">
            Você tem <strong>{profile._count.warnings} advertência{profile._count.warnings !== 1 ? "s" : ""}</strong>.
            {" "}Ao atingir 3, sua conta será suspensa automaticamente.
          </p>
        </div>
      )}

      {/* ── Incomplete warning ── */}
      {isIncomplete && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-coral/20 bg-coral/5 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-coral">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              Perfil incompleto —{" "}
              {!profile.bio && "falta a bio. "}
              {profile.priceHour === 0 && "falta o valor por hora. "}
              {!profile.whatsappPhone && "falta o WhatsApp."}
            </span>
          </div>
          <Link href="/painel/perfil" className="shrink-0 text-xs font-bold text-coral hover:underline">
            Completar →
          </Link>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Views */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Visualizações</p>
            <Eye className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{profile.viewsThisMonth.toLocaleString("pt-BR")}</p>
          <p className="mt-0.5 text-xs text-muted">acumulado</p>
          <div className="mt-3 h-8">
            <Sparkline data={[...Array(7)].map((_, i) => Math.max(0, viewsPeriod - (6 - i) * 2))} color="#86868b" />
          </div>
        </div>

        {/* Curtidas */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Curtidas</p>
            <Heart className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{favoritesCount}</p>
          <p className="mt-0.5 text-xs text-muted">perfis salvos</p>
          <div className="mt-3 h-8">
            <BarChart data={[1, 1, 2, 2, 3, 4, Math.max(favoritesCount, 4)]} color="#ff375f" />
          </div>
        </div>

        {/* Faturamento */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Faturamento</p>
            <TrendingUp className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{formatBrl(totalMonth)}</p>
          <p className="mt-0.5 text-xs text-muted capitalize">{monthName}</p>
          <div className="mt-3 h-8">
            <BarChart data={revenueByDay} color="#ff375f" />
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">

        {/* Revenue chart */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-muted">Faturamento · últimos 14 dias</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{formatBrl(totalMonth)}</p>
            </div>
            <Link href="/painel/financeiro"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-blue hover:bg-black/[0.04] transition-colors">
              Ver tudo <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="h-32">
            <BarChart data={revenueByDay} color="#ff375f" />
          </div>
          <div className="mt-2 flex justify-between text-2xs text-muted">
            <span>-13 dias</span>
            <span>hoje</span>
          </div>
          {/* Summary row */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-black/[0.05] pt-4">
            <div>
              <p className="text-2xs text-muted">Encontros</p>
              <p className="mt-0.5 text-md font-semibold">{paidRows.length}</p>
            </div>
            <div>
              <p className="text-2xs text-muted">Ticket médio</p>
              <p className="mt-0.5 text-md font-semibold">{avgTicket > 0 ? formatBrl(avgTicket) : "—"}</p>
            </div>
            <div>
              <p className="text-2xs text-muted">No-shows</p>
              <p className="mt-0.5 text-md font-semibold">{financialRows.filter((r) => r.isNoShow).length}</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Boost */}
          <div className="rounded-2xl bg-foreground p-5 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" strokeWidth={1.5} />
              <p className="text-md font-semibold">Boost · topo da lista</p>
            </div>
            {isBoosted ? (
              <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2">
                <p className="text-sm font-semibold text-warning">Boost ativo</p>
                <p className="mt-0.5 text-xs text-white/60">
                  Expira {new Date(profile.featuredUntil!).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-white/60">Até 3× mais views nas próximas 24h.</p>
                <p className="mt-3 text-2xl font-semibold">R$ 89</p>
                <Link href="/planos"
                  className="mt-3 block w-full rounded-full bg-white py-2.5 text-center text-base font-semibold text-foreground shadow-sm transition hover:bg-white/90 active:scale-[0.98]">
                  Disparar boost
                </Link>
              </>
            )}
          </div>

          {/* Views do período */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-muted mb-1">Visualizações · período atual</p>
            <p className="text-4xl font-semibold tabular-nums tracking-tight">{viewsPeriod.toLocaleString("pt-BR")}</p>
            <p className="mt-0.5 text-xs text-muted">desde o início do período de ranking</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Heart, MessageCircle, TrendingUp, Zap, ArrowUpRight, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countWhatsAppClicksToday, listWhatsAppClicksRecent, listFinancialRecordsForMonth } from "@/lib/queries";
import { formatBrl } from "@/lib/money";

export const dynamic = "force-dynamic";

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, color = "#c8102e" }: { data: number[]; color?: string }) {
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
function Sparkline({ data, color = "#c8102e" }: { data: number[]; color?: string }) {
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
    include: { city: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const [clicks, clicksToday, financialRows] = await Promise.all([
    listWhatsAppClicksRecent(profile.id, 5),
    countWhatsAppClicksToday(profile.id),
    listFinancialRecordsForMonth(profile.id, year, month),
  ]);

  const favRows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Favorite" WHERE "profileId" = ${profile.id}
  `;
  const favoritesCount = Number(favRows[0]?.count ?? 0);
  const viewsPeriod = (profile as Record<string, unknown>).viewsCurrentPeriod as number ?? 0;
  const uniqueVisitors = new Set(clicks.map((c) => c.visitor)).size;
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();

  // Financial stats
  const totalMonth = financialRows.reduce((a, r) => a + r.amountBrl, 0);
  const paidRows   = financialRows.filter((r) => !r.isNoShow);
  const avgTicket  = paidRows.length > 0 ? Math.round(paidRows.reduce((a, r) => a + r.amountBrl, 0) / paidRows.length) : 0;

  // Revenue by day (last 14 days)
  const revenueByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(today - 13 + i);
    const dayStr = d.toDateString();
    return financialRows
      .filter((r) => new Date(r.occurredAt).toDateString() === dayStr && !r.isNoShow)
      .reduce((a, r) => a + r.amountBrl, 0);
  });

  // WhatsApp clicks last 7 days (mock from recent clicks count)
  const clicksByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(today - 6 + i);
    const dayStr = d.toDateString();
    return clicks.filter((c) => new Date(c.clickedAt).toDateString() === dayStr).length;
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {profile.displayName}<span className="text-coral">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold ${
            profile.isOnline ? "border-success/30 bg-success/10 text-success" : "border-line bg-white text-muted"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${profile.isOnline ? "bg-success" : "bg-muted"}`} />
            {profile.isOnline ? "Online" : "Pausado"}
          </span>
          <Link href={`/p/${profile.slug}`}
            className="inline-flex items-center gap-1.5 border border-line bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-foreground transition">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ver perfil
          </Link>
        </div>
      </div>

      {/* ── Incomplete warning ── */}
      {isIncomplete && (
        <div className="flex items-center justify-between gap-4 border border-coral/30 bg-coral/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-coral">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              Perfil incompleto —{" "}
              {!profile.bio && "falta a bio. "}
              {profile.priceHour === 0 && "falta o valor por hora. "}
              {!profile.whatsappPhone && "falta o WhatsApp."}
            </span>
          </div>
          <Link href="/painel/perfil" className="shrink-0 text-xs font-bold text-coral underline">
            Completar →
          </Link>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Views */}
        <div className="border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Visualizações</p>
            <Eye className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{profile.viewsThisMonth.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-[10px] text-muted">acumulado</p>
          <div className="mt-3 h-8">
            <Sparkline data={[...Array(7)].map((_, i) => Math.max(0, viewsPeriod - (6 - i) * 2))} color="#6b6b6b" />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">WhatsApp hoje</p>
            <MessageCircle className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{clicksToday}</p>
          <p className="mt-1 text-[10px] text-muted">{uniqueVisitors} visitante{uniqueVisitors !== 1 ? "s" : ""} único{uniqueVisitors !== 1 ? "s" : ""}</p>
          <div className="mt-3 h-8">
            <BarChart data={clicksByDay} color="#0a9f6e" />
          </div>
        </div>

        {/* Curtidas */}
        <div className="border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Curtidas</p>
            <Heart className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{favoritesCount}</p>
          <p className="mt-1 text-[10px] text-muted">perfis salvos</p>
          <div className="mt-3 h-8">
            <BarChart data={[1, 1, 2, 2, 3, 4, Math.max(favoritesCount, 4)]} color="#c8102e" />
          </div>
        </div>

        {/* Faturamento */}
        <div className="border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Faturamento</p>
            <TrendingUp className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{formatBrl(totalMonth)}</p>
          <p className="mt-1 text-[10px] text-muted capitalize">{monthName}</p>
          <div className="mt-3 h-8">
            <BarChart data={revenueByDay} color="#c8102e" />
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">

        {/* Revenue chart */}
        <div className="border border-line bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Faturamento · últimos 14 dias</p>
              <p className="mt-1 text-lg font-bold">{formatBrl(totalMonth)}</p>
            </div>
            <Link href="/painel/financeiro"
              className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-foreground transition">
              Ver tudo <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="h-32">
            <BarChart data={revenueByDay} color="#c8102e" />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted">
            <span>-13 dias</span>
            <span>hoje</span>
          </div>
          {/* Summary row */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">Encontros</p>
              <p className="mt-1 font-bold">{paidRows.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">Ticket médio</p>
              <p className="mt-1 font-bold">{avgTicket > 0 ? formatBrl(avgTicket) : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">No-shows</p>
              <p className="mt-1 font-bold">{financialRows.filter((r) => r.isNoShow).length}</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Boost */}
          <div className="border border-foreground bg-sidebar p-5 text-white">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
              <p className="font-bold text-sm">Boost · topo da lista</p>
            </div>
            {isBoosted ? (
              <div className="mt-3 border border-orange-500/30 bg-orange-500/10 px-3 py-2">
                <p className="text-xs font-semibold text-orange-400">Boost ativo</p>
                <p className="mt-0.5 text-[10px] text-white/60">
                  Expira {new Date(profile.featuredUntil!).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs text-white/60">Até 3× mais views nas próximas 24h.</p>
                <p className="mt-3 text-xl font-bold">R$ 89</p>
                <Link href="/planos"
                  className="mt-3 block w-full bg-white py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground">
                  Disparar boost
                </Link>
              </>
            )}
          </div>

          {/* Last 5 WhatsApp clicks */}
          <div className="border border-line bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Últimos cliques · WhatsApp</p>
              <span className="text-xs font-bold tabular-nums">{clicksToday} hoje</span>
            </div>
            {clicks.length === 0 ? (
              <p className="text-xs text-muted">Nenhum clique ainda.</p>
            ) : (
              <ul className="space-y-2">
                {clicks.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {c.clickedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-medium truncate mx-2">{c.visitor}</span>
                    <span className="text-muted shrink-0">{c.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

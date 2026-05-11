import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Eye, Heart, MessageCircle, TrendingUp, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countWhatsAppClicksToday, listWhatsAppClicksRecent } from "@/lib/queries";
import { formatBrl } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PainelOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/painel");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { city: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const [clicks, clicksToday] = await Promise.all([
    listWhatsAppClicksRecent(profile.id, 6),
    countWhatsAppClicksToday(profile.id),
  ]);

  // Count favorites — use raw to avoid stale client issues
  const favRows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "Favorite" WHERE "profileId" = ${profile.id}
  `;
  const favoritesCount = Number(favRows[0]?.count ?? 0);

  // viewsCurrentPeriod may not be in the cached client yet
  const viewsPeriod = (profile as Record<string, unknown>).viewsCurrentPeriod as number ?? 0;
  const uniqueVisitors = new Set(clicks.map((c) => c.visitor)).size;
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting}, {profile.displayName}<span className="text-coral">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            profile.isOnline
              ? "border-success/30 bg-success/10 text-success"
              : "border-line bg-white text-muted"
          }`}>
            <span className={`h-2 w-2 rounded-full ${profile.isOnline ? "bg-success" : "bg-muted"}`} />
            {profile.isOnline ? "Perfil online" : "Perfil pausado"}
          </span>
          <Link
            href={`/p/${profile.slug}`}
            className="inline-flex items-center gap-2 bg-foreground px-3 py-1.5 text-xs font-medium text-white"
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
            Ver perfil público
          </Link>
        </div>
      </div>

      {/* Stats cards — real data */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Visualizações</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{profile.viewsThisMonth.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-[10px] text-muted">Total acumulado</p>
        </div>

        <div className="border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">WhatsApp hoje</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{clicksToday}</p>
          <p className="mt-1 text-[10px] text-muted">{uniqueVisitors} visitante{uniqueVisitors !== 1 ? "s" : ""} único{uniqueVisitors !== 1 ? "s" : ""}</p>
        </div>

        <div className="border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Curtidas</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{favoritesCount}</p>
          <p className="mt-1 text-[10px] text-muted">Perfis que te salvaram</p>
        </div>

        <div className="border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Visualizações período</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">{viewsPeriod.toLocaleString("pt-BR")}</p>
          <p className="mt-1 text-[10px] text-muted">Semana atual (Em alta)</p>
        </div>
      </div>

      {/* Boost + WhatsApp clicks */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* WhatsApp recent clicks */}
        <div className="border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Cliques no WhatsApp · hoje · {clicksToday}
            </h2>
          </div>

          {profile.whatsappPhone && (
            <div className="mt-4 flex items-center justify-between border border-line bg-[#fafafa] px-3 py-2 text-sm">
              <span className="font-mono text-muted">
                {profile.whatsappPhone.replace(/(\+\d{2})(\d{2})(\d{4,5})(\d{4})/, "$1 $2 $3-$4")}
              </span>
              <Link href="/conta/onboarding/perfil" className="text-xs underline text-muted">
                Editar
              </Link>
            </div>
          )}

          {clicks.length > 0 ? (
            <ul className="mt-4 space-y-2 text-xs">
              {clicks.map((c) => (
                <li key={c.id} className="flex justify-between text-muted">
                  <span>
                    {c.clickedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {c.visitor}
                  </span>
                  <span>{c.source}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Nenhum clique hoje ainda.</p>
          )}

          <p className="mt-4 flex gap-2 text-[10px] leading-relaxed text-muted">
            <span className="text-coral">ⓘ</span>
            Conversas acontecem no WhatsApp. A Privello não armazena mensagens.
          </p>
        </div>

        {/* Boost CTA */}
        <div className="border border-foreground bg-sidebar p-6 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-400" strokeWidth={1.5} />
            <h2 className="font-bold">Topo da lista</h2>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Disparo único — até 3× mais views nas próximas 24h.
          </p>
          {isBoosted ? (
            <div className="mt-4 rounded border border-orange-500/30 bg-orange-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-orange-400">Boost ativo</p>
              <p className="mt-1 text-xs text-white/60">
                Expira em {new Date(profile.featuredUntil!).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-2xl font-bold">R$ 89 / disparo</p>
              <Link
                href="/planos"
                className="mt-6 block w-full bg-white py-3 text-center text-xs font-bold uppercase tracking-wider text-foreground"
              >
                Disparar boost agora
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Profile completeness warning */}
      {(!profile.bio || profile.priceHour === 0 || !profile.whatsappPhone) && (
        <div className="border border-coral/30 bg-coral/5 p-5">
          <p className="text-sm font-semibold text-coral">Perfil incompleto</p>
          <p className="mt-1 text-xs text-muted">
            {!profile.bio && "Falta a bio. "}
            {profile.priceHour === 0 && "Falta o valor por hora. "}
            {!profile.whatsappPhone && "Falta o WhatsApp. "}
          </p>
          <Link
            href="/conta/onboarding/perfil"
            className="mt-3 inline-block border border-coral px-4 py-2 text-xs font-semibold text-coral"
          >
            Completar perfil →
          </Link>
        </div>
      )}
    </div>
  );
}

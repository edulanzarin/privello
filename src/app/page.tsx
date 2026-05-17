/**
 * Página RSC — Home pública (landing) — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 60` (Route Segment Config — janela de 60s).
 *
 * Steering: `.kiro/steering/design-system.md` §13.6 (Hero da Home).
 *
 * Estrutura:
 *  1. Hero — headline Inter 300 grande + sub + glass stats card lateral.
 *  2. Search bar pill grande (HeroSearchForm).
 *  3. Pílulas top-cidades (glass-pill secundárias).
 *  4. "Em destaque" — só renderiza com boost ativo. Grid 3-col.
 *  5. "Em alta da semana" — sempre renderiza ou mensagem fallback.
 *  6. "Verificação séria" — bloco editorial 2-col com 3 steps.
 *  7. Footer.
 *
 * Cross-refs:
 * - src/lib/services/stats.service.ts
 * - src/lib/services/profile.service.ts (getSectionProfiles)
 * - src/components/home/profile-section.tsx
 * - src/components/marketing/hero-search-form.tsx
 */
import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck, Camera, Sparkles, TrendingUp } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroSearchForm } from "@/components/marketing/hero-search-form";
import { ProfileSection } from "@/components/home/profile-section";
import { FALLBACK_PLATFORM_STATS } from "@/lib/constants";
import { getPlatformStats, getSectionProfiles } from "@/lib/services";
import { prisma } from "@/lib/prisma";

// Cache strategy: revalidate=60 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 1.
export const revalidate = 60;

async function getTopCities(limit = 5) {
  const cities = await prisma.city.findMany({
    where: { profiles: { some: {} } },
    select: { name: true, slug: true, _count: { select: { profiles: true } } },
    orderBy: { profiles: { _count: "desc" } },
    take: limit,
  });
  return cities.map((c) => ({ href: `/descobrir/${c.slug}`, label: c.name }));
}

export default async function HomePage() {
  let stats = FALLBACK_PLATFORM_STATS;
  let hot: { profiles: Awaited<ReturnType<typeof getSectionProfiles>>["profiles"]; hasMore: boolean } = { profiles: [], hasMore: false };
  let boosted: typeof hot = { profiles: [], hasMore: false };
  let pills: { href: string; label: string }[] = [];

  try {
    const [s, h, b, p] = await Promise.all([
      getPlatformStats(),
      getSectionProfiles("hot", 0),
      getSectionProfiles("boosted", 0),
      getTopCities(5),
    ]);
    stats = s;
    hot = h;
    boosted = b;
    pills = p;
  } catch {
    // use fallbacks
  }

  return (
    <>
      <SiteHeader />
      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            {/* Left: headline + sub */}
            <div>
              <h1 className="font-bold leading-[1.05] tracking-[-0.025em] text-ink text-5xl sm:text-6xl lg:text-7xl">
                Acompanhantes verificadas,{" "}
                <span className="text-rose">perto de você.</span>
              </h1>
              <p className="mt-6 max-w-xl text-md leading-relaxed text-ink-dim sm:text-lg">
                Fotos reais, áudio e vídeo. Perfis com verificação de identidade.
                Você escolhe a cidade, o horário e com quem se encontrar.
              </p>
            </div>

            {/* Right: stats glass */}
            <aside className="glass-panel rounded-2xl p-6">
              <ul className="space-y-3.5 text-md">
                <li className="flex items-center justify-between gap-4 border-b border-line pb-3.5">
                  <span className="text-ink-dim">Perfis ativos</span>
                  <span className="font-bold tabular-nums text-ink">
                    {stats.profiles.toLocaleString("pt-BR")}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4 border-b border-line pb-3.5">
                  <span className="text-ink-dim">Verificados</span>
                  <span className="font-bold tabular-nums text-ink">
                    {stats.verifiedPct}%
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4 border-b border-line pb-3.5">
                  <span className="text-ink-dim">Cidades</span>
                  <span className="font-bold tabular-nums text-ink">
                    {stats.cities}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4">
                  <span className="text-ink-dim">Revisão de perfil</span>
                  <span className="font-bold text-ink">24h</span>
                </li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-ink-faint">
                Selo de verificação via documento + selfie. Conteúdo adulto (+18).
              </p>
            </aside>
          </div>

          {/* Search bar */}
          <div className="mt-10">
            <Suspense
              fallback={
                <div className="h-16 animate-pulse rounded-full bg-line/40" />
              }
            >
              <HeroSearchForm />
            </Suspense>
            {pills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {pills.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="inline-flex items-center rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-rose-soft hover:text-rose hover:border-rose/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Em destaque (boost ativo) ─────────────────────────────── */}
        {boosted.profiles.length > 0 && (
          <section className="border-t border-line py-14 lg:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
                  Em destaque
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-peach-soft px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-peach">
                  Boost ativo
                </span>
              </div>
            </div>
            <ProfileSection
              type="boosted"
              initialProfiles={boosted.profiles}
              initialHasMore={boosted.hasMore}
              viewAllHref="/em-destaque"
            />
          </section>
        )}

        {/* ── Em alta ───────────────────────────────────────────────── */}
        <section className="border-t border-line py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
                Em alta
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-rose">
                <TrendingUp className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                Da semana
              </span>
            </div>
          </div>
          {hot.profiles.length ? (
            <ProfileSection
              type="hot"
              initialProfiles={hot.profiles}
              initialHasMore={hot.hasMore}
              viewAllHref="/em-alta"
            />
          ) : (
            <p className="mx-auto mt-8 max-w-7xl px-4 text-center text-base text-ink-dim sm:px-6 lg:px-8">
              Novos perfis em breve. Seja a primeira a se cadastrar na sua cidade.
            </p>
          )}
        </section>

        {/* ── Verificação séria ────────────────────────────────────── */}
        <section className="border-t border-line py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="font-bold leading-[1.1] tracking-[-0.02em] text-ink text-4xl sm:text-5xl">
                  Verificação{" "}
                  <span className="text-rose">séria.</span>
                  <br />
                  Sem rodeios.
                </h2>
                <p className="mt-6 max-w-md text-md leading-relaxed text-ink-dim">
                  Documento e selfie analisados por humano. Trilha de auditoria
                  completa. Selo público no perfil de quem passa.
                </p>
              </div>

              <ol className="space-y-6">
                <Step
                  n="01"
                  Icon={Camera}
                  title="Cadastro do perfil"
                  desc="Informações, valores e fotos públicas/privadas com diretrizes claras."
                />
                <Step
                  n="02"
                  Icon={Sparkles}
                  title="Publicação imediata"
                  desc="Seu perfil entra na listagem assim que você completa o cadastro."
                />
                <Step
                  n="03"
                  Icon={ShieldCheck}
                  title="Verificação opcional → selo"
                  desc="Envie documento + selfie para ganhar o selo de verificada. Conferência humana e trilha de auditoria."
                />
              </ol>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Step({
  n,
  Icon,
  title,
  desc,
}: {
  n: string;
  Icon: typeof ShieldCheck;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-5">
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-2xs font-semibold uppercase tracking-[0.2em] text-rose">
          {n}
        </span>
        <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/55 backdrop-blur-md">
          <Icon className="h-4 w-4 text-rose" strokeWidth={1.8} />
        </span>
      </div>
      <div className="flex-1 pt-1">
        <p className="text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-md leading-relaxed text-ink-dim">{desc}</p>
      </div>
    </li>
  );
}

/**
 * Página RSC — Home pública (landing).
 *
 * Rota: `/`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 60` (Route Segment Config — janela de 60s).
 *
 * Renderiza hero com busca, estatísticas da plataforma, seções "Em destaque"
 * (boost ativo) e "Em alta da semana", além de pílulas de top cidades.
 *
 * Cross-refs:
 * - src/lib/services/stats.service.ts
 * - src/lib/services/profile.service.ts (getSectionProfiles)
 * - src/components/home/profile-section.tsx
 * - src/components/marketing/hero-search-form.tsx
 */
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroSearchForm } from "@/components/marketing/hero-search-form";
import { ProfileSection } from "@/components/home/profile-section";
import { FALLBACK_PLATFORM_STATS } from "@/lib/constants";
import { getPlatformStats, getSectionProfiles } from "@/lib/services";
import { prisma } from "@/lib/prisma";

// Cache strategy: revalidate=60 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 1.
// Home pública (cidades top + stats + hot/boosted sections); janela de 60s aceitável.
// Decisão de não ativar `cacheComponents: true` registrada em §5.1.
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
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <h1 className="text-6xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
                Acompanhantes verificadas,{" "}
                <span className="text-coral">
                  perto de você.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Fotos reais, áudio e vídeo. Perfis com verificação de identidade. Você escolhe a cidade, o horário e com quem se encontrar.
              </p>
            </div>
            <aside className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
              <ul className="space-y-4 text-md">
                <li className="flex justify-between gap-4 border-b border-black/[0.05] pb-3">
                  <span className="text-muted">Perfis ativos</span>
                  <span className="font-semibold tabular-nums">{stats.profiles.toLocaleString("pt-BR")}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-black/[0.05] pb-3">
                  <span className="text-muted">Verificados</span>
                  <span className="font-semibold tabular-nums">{stats.verifiedPct}%</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-black/[0.05] pb-3">
                  <span className="text-muted">Cidades</span>
                  <span className="font-semibold tabular-nums">{stats.cities}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-muted">Revisão de perfil</span>
                  <span className="font-semibold">24h</span>
                </li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Selo de verificação via documento + selfie. Conteúdo adulto (+18).
              </p>
            </aside>
          </div>

          <div className="mt-12">
            <Suspense fallback={<div className="h-24 animate-pulse bg-line" />}>
              <HeroSearchForm />
            </Suspense>
            <div className="mt-4 flex flex-wrap gap-2">
              {pills.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-black/[0.03]"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Em destaque (boost ativo) — só aparece quando há perfis boosted ── */}
        {boosted.profiles.length > 0 && (
          <section className="border-t border-black/[0.06] py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="text-4xl font-semibold tracking-tight">
                Em destaque{" "}
                <span className="text-muted font-normal">· boost ativo</span>
              </h2>
            </div>
            <ProfileSection
              type="boosted"
              initialProfiles={boosted.profiles}
              initialHasMore={boosted.hasMore}
              viewAllHref="/em-destaque"
            />
          </section>
        )}

        {/* ── Em alta da semana ── */}
        <section className="border-t border-black/[0.06] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-4xl font-semibold tracking-tight">
              Em alta <span className="text-muted font-normal">da semana</span>
            </h2>
          </div>
          {hot.profiles.length ? (
            <ProfileSection
              type="hot"
              initialProfiles={hot.profiles}
              initialHasMore={hot.hasMore}
              viewAllHref="/em-alta"
            />
          ) : (
            <p className="mx-auto mt-10 max-w-6xl px-4 text-center text-sm text-muted sm:px-6">
              Novos perfis em breve. Seja o primeiro a se cadastrar na sua cidade.
            </p>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Verificação <span className="text-coral">séria.</span> Sem rodeios.
            </h2>
            <ol className="space-y-8 text-md">
              <li className="flex gap-4">
                <span className="text-3xl font-bold text-coral">01</span>
                <div>
                  <p className="font-semibold">Cadastro do perfil</p>
                  <p className="mt-1 text-muted">Informações, valores e fotos públicas/privadas com diretrizes claras.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-3xl font-bold text-coral">02</span>
                <div>
                  <p className="font-semibold">Publicação imediata</p>
                  <p className="mt-1 text-muted">Seu perfil entra na listagem assim que completar o cadastro.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="text-3xl font-bold text-coral">03</span>
                <div>
                  <p className="font-semibold">Verificação opcional → selo</p>
                  <p className="mt-1 text-muted">Envie documento + selfie para ganhar o selo de verificada. Conferência humana e trilha de auditoria.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Página RSC — Listagem de perfis por cidade (descobrir) — Design System v2.
 *
 * Rota: `/descobrir/[citySlug]`.
 * Tipo: Server Component.
 * Auth: público (lê `auth()` apenas para diferenciar UI quando logado, ex:
 *  permitir likes em stories).
 * Cache: `force-dynamic` (filtros, sort, view e stories personalizadas).
 *
 * Steering: `.kiro/steering/design-system.md` §13.3 + §5.2 (grid 3-col).
 *
 * Estrutura (sem sidebar lateral — decisão D do briefing):
 *  1. SiteHeader.
 *  2. CitySessionSaver (efeito).
 *  3. DiscoverToolbar (header sticky completo: cidade + sort + filtros + view + chips + active pills).
 *  4. StoryBar (se houver stories ativas).
 *  5. Banner discreto: "Perfis com destaque aparecem primeiro…".
 *  6. Grid masonry de ProfileCards (3-col desktop / 2-col tablet / 1-col mobile).
 *  7. SiteFooter.
 *
 * Cross-refs:
 * - src/components/discover/discover-toolbar.tsx (header sticky)
 * - src/components/profile/profile-card.tsx (decisão F1)
 * - src/components/stories/story-bar.tsx
 */
import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";
import { CitySessionSaver } from "@/components/discover/city-session-saver";
import { DiscoverToolbar } from "@/components/discover/discover-toolbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileListRow } from "@/components/profile/profile-list-row";
import { parseDiscoverSearchParams } from "@/lib/discover-params";
import { getOrCreateCityBySlug, listProfilesForCity, listStoriesForCity } from "@/lib/services";
import { StoryBar } from "@/components/stories/story-bar";
import { auth } from "@/lib/auth";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdKey,
} from "@/lib/seo";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md §3.2 linha 3.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const city = await getOrCreateCityBySlug(citySlug);
  const title = `Acompanhantes em ${city.name}`;
  const description = `Encontre acompanhantes em ${city.name}. Perfis verificados com fotos reais, áudio e vídeo. Acesse agora no Privello.`;
  const canonicalPath = `/descobrir/${citySlug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: absoluteUrl(canonicalPath),
      title: `${title} · privello.`,
      description: `Acompanhantes verificadas em ${city.name}. Fotos reais, áudio e vídeo.`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

type PageProps = {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiscoverPage({ params, searchParams }: PageProps) {
  const { citySlug } = await params;
  const raw = await searchParams;
  const { filters, sort, view } = parseDiscoverSearchParams(raw);

  const city = await getOrCreateCityBySlug(citySlug);

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const [profiles, storyGroups] = await Promise.all([
    listProfilesForCity(city.id, filters, sort),
    listStoriesForCity(city.id, session?.user?.id, filters.gender),
  ]);
  const count = profiles.length;

  // Detecta se há filtros aplicados (pra mostrar "Limpar filtros" no empty state).
  const hasFilters =
    filters.gender !== undefined ||
    filters.verifiedOnly ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.ageMin != null ||
    filters.ageMax != null ||
    filters.hasOwnPlace ||
    filters.homeVisit ||
    !!filters.search ||
    sort !== "relevance" ||
    view !== "grid";

  // Structured data — só emite Breadcrumb + ItemList na visualização canônica
  // (sem filtros nem sort custom). Páginas filtradas usam `noindex` lógico via
  // canonical apontando para a base, então não precisam de nodes próprios.
  const ldBlocks = !hasFilters
    ? [
      breadcrumbJsonLd([
        { name: "Descobrir", path: "/descobrir" },
        { name: city.name, path: `/descobrir/${citySlug}` },
      ]),
      itemListJsonLd(
        profiles.slice(0, 20).map((p) => ({
          name: p.displayName,
          path: `/p/${p.slug}`,
        })),
        `Acompanhantes em ${city.name}`,
      ),
    ]
    : [];

  return (
    <>
      {ldBlocks.map((ld) => (
        <script
          key={jsonLdKey(ld)}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <SiteHeader activeHref={`/descobrir/${citySlug}`} />
      <CitySessionSaver citySlug={citySlug} />

      <Suspense fallback={null}>
        <DiscoverToolbar
          citySlug={citySlug}
          cityName={city.name}
          count={count}
          initialFilters={{
            gender: filters.gender,
            verifiedOnly: filters.verifiedOnly,
            sort,
            view,
            priceMin: filters.priceMin,
            priceMax: filters.priceMax,
            ageMin: filters.ageMin,
            ageMax: filters.ageMax,
            hasOwnPlace: filters.hasOwnPlace,
            homeVisit: filters.homeVisit,
          }}
        />
      </Suspense>

      <main className="min-h-screen pb-32">
        {/* ── Stories ───────────────────────────────────────────────── */}
        {storyGroups.length > 0 && (
          <StoryBar groups={storyGroups} isClient={isLoggedIn} />
        )}

        {/* ── Body ──────────────────────────────────────────────────── */}
        {count === 0 ? (
          <EmptyDiscover
            cityName={city.name}
            citySlug={citySlug}
            hasFilters={hasFilters}
          />
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Banner glass discreto */}
            <p className="mb-6 text-center text-sm text-ink-dim">
              Perfis com destaque aparecem primeiro.
            </p>

            <ViewTransition
              key={`${citySlug}-${view}`}
              name="discover-grid"
              share="auto"
              enter="auto"
              default="none"
            >
              {view === "list" ? (
                <div className="space-y-3">
                  {profiles.map((p) => (
                    <ProfileListRow key={p.id} profile={p} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {profiles.map((p) => (
                    <ProfileCard key={p.id} profile={p} />
                  ))}
                </div>
              )}
            </ViewTransition>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyDiscover({
  cityName,
  citySlug,
  hasFilters,
}: {
  cityName: string;
  citySlug: string;
  hasFilters: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <p className="font-light text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
          Ainda não há perfis em <span className="text-rose">{cityName}</span>.
        </p>
        <p className="mt-4 text-md leading-relaxed text-ink-dim">
          {hasFilters
            ? "Nenhum perfil corresponde aos filtros selecionados. Tente remover alguns filtros."
            : "Seja a primeira a se cadastrar nessa cidade ou explore outras regiões."}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {hasFilters && (
            <a
              href={`/descobrir/${citySlug}`}
              className="rounded-full bg-rose px-5 py-2.5 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Limpar filtros
            </a>
          )}
          <a
            href="/descobrir"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-base font-medium text-ink transition-all duration-150 hover:bg-line/40 hover:border-ink/15 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Buscar outra cidade
          </a>
        </div>
      </div>
    </div>
  );
}

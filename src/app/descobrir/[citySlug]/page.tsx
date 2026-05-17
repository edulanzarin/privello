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
import { buildDiscoverHref, parseDiscoverSearchParams } from "@/lib/discover-params";
import { getOrCreateCityBySlug, listProfilesForCity, listStoriesForCity } from "@/lib/services";
import { StoryBar } from "@/components/stories/story-bar";
import { auth } from "@/lib/auth";

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
  return {
    title,
    description: `Encontre acompanhantes em ${city.name}. Perfis verificados com fotos reais, áudio e vídeo. Acesse agora no Privello.`,
    openGraph: {
      title: `${title} · privello.`,
      description: `Acompanhantes verificadas em ${city.name}. Fotos reais, áudio e vídeo.`,
    },
  };
}

type PageProps = {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const GENDER_OPTIONS = [
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
] as const;

export default async function DiscoverPage({ params, searchParams }: PageProps) {
  const { citySlug } = await params;
  const raw = await searchParams;
  const { filters, view } = parseDiscoverSearchParams(raw);

  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.set(k, v);
  }

  const city = await getOrCreateCityBySlug(citySlug);

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const [profiles, storyGroups] = await Promise.all([
    listProfilesForCity(city.id, filters, parseDiscoverSearchParams(raw).sort),
    listStoriesForCity(city.id, session?.user?.id, filters.gender),
  ]);
  const count = profiles.length;

  // Active filter pills — todos os filtros vêm do drawer agora.
  const activePills: { label: string; href: string }[] = [];
  if (filters.gender === "garotos" || filters.gender === "casais") {
    const g = GENDER_OPTIONS.find((o) => o.value === filters.gender);
    if (g)
      activePills.push({
        label: g.label,
        href: buildDiscoverHref(citySlug, { genero: null }, sp),
      });
  }
  if (filters.verifiedOnly) {
    activePills.push({
      label: "Verificadas",
      href: buildDiscoverHref(citySlug, { verified: null }, sp),
    });
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    activePills.push({
      label: `R$ ${filters.priceMin ?? "—"}–${filters.priceMax ?? "—"}/h`,
      href: buildDiscoverHref(citySlug, { pmin: null, pmax: null }, sp),
    });
  }
  if (filters.ageMin != null || filters.ageMax != null) {
    activePills.push({
      label: `${filters.ageMin ?? "—"}–${filters.ageMax ?? "—"} anos`,
      href: buildDiscoverHref(citySlug, { amin: null, amax: null }, sp),
    });
  }
  if (filters.hasOwnPlace) {
    activePills.push({
      label: "Local próprio",
      href: buildDiscoverHref(citySlug, { local: null }, sp),
    });
  }
  if (filters.homeVisit) {
    activePills.push({
      label: "A domicílio",
      href: buildDiscoverHref(citySlug, { domicilio: null }, sp),
    });
  }
  if (filters.search) {
    activePills.push({
      label: `"${filters.search}"`,
      href: buildDiscoverHref(citySlug, { q: null }, sp),
    });
  }

  return (
    <>
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
            priceMin: filters.priceMin,
            priceMax: filters.priceMax,
            ageMin: filters.ageMin,
            ageMax: filters.ageMax,
            hasOwnPlace: filters.hasOwnPlace,
            homeVisit: filters.homeVisit,
          }}
          activePills={activePills}
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
            hasFilters={activePills.length > 0}
          />
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Banner glass discreto */}
            <p className="mb-6 text-center text-sm text-ink-dim">
              Perfis com destaque aparecem primeiro — todos passaram pela mesma verificação.
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
            href="/buscar"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-base font-medium text-ink transition-all duration-150 hover:bg-line/40 hover:border-ink/15 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Buscar outra cidade
          </a>
        </div>
      </div>
    </div>
  );
}

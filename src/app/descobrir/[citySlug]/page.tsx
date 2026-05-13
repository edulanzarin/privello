import Link from "next/link";
import { Suspense } from "react";
import { DiscoverViewToggle } from "@/components/discover/discover-view-toggle";
import { CitySessionSaver } from "@/components/discover/city-session-saver";
import { CitySwitcher } from "@/components/discover/city-switcher";
import { ProviderBanner } from "@/components/layout/provider-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileListRow } from "@/components/profile/profile-list-row";
import { buildDiscoverHref, parseDiscoverSearchParams } from "@/lib/discover-params";
import { getOrCreateCityBySlug, listProfilesForCity, listStoriesForCity } from "@/lib/queries";
import { StoryBar } from "@/components/stories/story-bar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const GENDER_OPTIONS = [
  { value: "", label: "Garotas" },
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
] as const;

export default async function DiscoverPage({ params, searchParams }: PageProps) {
  const { citySlug } = await params;
  const raw = await searchParams;
  const { filters, sort, view } = parseDiscoverSearchParams(raw);
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.set(k, v);
  }

  // Always resolves — creates the city row if it doesn't exist yet
  const city = await getOrCreateCityBySlug(citySlug);

  const session = await auth();
  // Provider detection: check if user has a profile (more reliable than role string)
  let isProvider = false;
  if (session?.user?.id) {
    const viewerProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (viewerProfile) isProvider = true;
  }

  const [profiles, storyGroups, districts] = await Promise.all([
    listProfilesForCity(city.id, filters, sort),
    listStoriesForCity(city.id, session?.user?.id),
    prisma.district.findMany({
      where: { cityId: city.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  const count = profiles.length;
  const isClientUser = !!session?.user?.id && !isProvider;

  const sortLabel =
    sort === "price_asc"
      ? "Menor preço /h"
      : sort === "price_desc"
        ? "Maior preço /h"
        : sort === "rating"
          ? "Melhor avaliação"
          : "Relevância editorial";

  // Active filter pills
  const activePills: { label: string; href: string }[] = [];
  if (filters.gender === "garotos" || filters.gender === "casais") {
    const g = GENDER_OPTIONS.find((o) => o.value === filters.gender);
    if (g) activePills.push({ label: g.label, href: buildDiscoverHref(citySlug, { genero: null }, sp) });
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    activePills.push({
      label: `R$ ${filters.priceMin ?? "—"}–${filters.priceMax ?? "—"} /h`,
      href: buildDiscoverHref(citySlug, { pmin: null, pmax: null }, sp),
    });
  }
  if (filters.ageMin != null || filters.ageMax != null) {
    activePills.push({
      label: `${filters.ageMin ?? "—"}–${filters.ageMax ?? "—"} anos`,
      href: buildDiscoverHref(citySlug, { amin: null, amax: null }, sp),
    });
  }
  if (filters.verifiedOnly) {
    activePills.push({ label: "Verificadas", href: buildDiscoverHref(citySlug, { verified: null }, sp) });
  }
  if (filters.onlineOnly) {
    activePills.push({ label: "Online agora", href: buildDiscoverHref(citySlug, { online: null }, sp) });
  }
  if (filters.hasOwnPlace) {
    activePills.push({ label: "Local próprio", href: buildDiscoverHref(citySlug, { local: null }, sp) });
  }
  if (filters.homeVisit) {
    activePills.push({ label: "A domicílio", href: buildDiscoverHref(citySlug, { domicilio: null }, sp) });
  }
  if (filters.search) {
    activePills.push({ label: `"${filters.search}"`, href: buildDiscoverHref(citySlug, { q: null }, sp) });
  }
  if (filters.districtSlug) {
    const d = districts.find((d) => d.slug === filters.districtSlug);
    if (d) activePills.push({ label: d.name, href: buildDiscoverHref(citySlug, { bairro: null }, sp) });
  }

  return (
    <>
      <SiteHeader activeHref={`/descobrir/${citySlug}`} />
      <CitySessionSaver citySlug={citySlug} />
      <CitySwitcher currentCityName={city.name} citySlug={citySlug} />
      {isProvider && <ProviderBanner variant="search" />}
      <main className="min-h-screen pb-28">
        {/* ── Header ── */}
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
              Descobrir / {city.name}
            </p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="font-serif text-3xl sm:text-4xl">
                {city.name} <span className="text-muted">·</span>{" "}
                <em className="font-serif text-2xl font-normal text-muted not-italic sm:text-3xl">
                  {count.toLocaleString("pt-BR")} perfis
                </em>
              </h1>
              {count > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Ordenar por</span>
                  <details className="relative">
                    <summary className="cursor-pointer list-none border border-line bg-white px-3 py-2 text-xs font-medium">
                      {sortLabel}
                    </summary>
                    <ul className="absolute right-0 z-20 mt-1 min-w-[200px] border border-line bg-white py-1 text-sm shadow-lg">
                      {(
                        [
                          ["relevance", "Relevância editorial"],
                          ["price_asc", "Menor preço /h"],
                          ["price_desc", "Maior preço /h"],
                          ["rating", "Melhor avaliação"],
                        ] as const
                      ).map(([value, label]) => (
                        <li key={value}>
                          <Link
                            href={buildDiscoverHref(citySlug, { ordem: value === "relevance" ? null : value }, sp)}
                            className="block px-3 py-2 hover:bg-black/5"
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                  <Suspense fallback={<div className="h-10 w-20 animate-pulse bg-line" />}>
                    <DiscoverViewToggle citySlug={citySlug} />
                  </Suspense>
                </div>
              )}
            </div>

            {activePills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {activePills.map((pill) => (
                  <Link
                    key={pill.label}
                    href={pill.href}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs text-foreground"
                  >
                    {pill.label}
                    <span className="text-coral">×</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stories ── */}
        {storyGroups.length > 0 && (
          <StoryBar groups={storyGroups} isClient={isClientUser} />
        )}

        {/* ── Body ── */}
        {count === 0 ? (
          /* ── Empty state ── */
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-md text-center">
              <p className="font-serif text-3xl">Ainda não há perfis em {city.name}.</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {activePills.length > 0
                  ? "Nenhum perfil corresponde aos filtros selecionados. Tente remover alguns filtros."
                  : "Seja o primeiro a se cadastrar nessa cidade ou explore outras regiões."}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {activePills.length > 0 && (
                  <Link
                    href={`/descobrir/${citySlug}`}
                    className="border border-foreground bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    Limpar filtros
                  </Link>
                )}
                <Link
                  href="/buscar"
                  className="border border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Buscar outra cidade
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[260px_1fr] lg:px-6">
            {/* ── Sidebar ── */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Search by name / @handle */}
              <form method="get" className="flex gap-2">
                <input type="hidden" name="ordem" value={sort === "relevance" ? "" : sort} />
                <input
                  name="q"
                  defaultValue={filters.search ?? ""}
                  placeholder="Nome ou @handle…"
                  className="flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-foreground"
                />
                <button type="submit" className="bg-foreground px-4 py-2.5 text-xs font-bold uppercase text-white">
                  Ir
                </button>
              </form>
              {filters.search && (
                <Link
                  href={`/buscar?q=${encodeURIComponent(filters.search)}`}
                  className="block text-center text-xs text-muted underline underline-offset-2 hover:text-foreground transition"
                >
                  Buscar em todas as cidades
                </Link>
              )}

              <details className="group lg:open" open>
                <summary className="flex cursor-pointer list-none items-center justify-between border border-line bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wider lg:hidden">
                  <span>Filtros</span>
                  <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
                </summary>

              <div className="flex items-center justify-between pt-2 lg:pt-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Filtros</p>
                <Link href={`/descobrir/${citySlug}`} className="text-xs text-muted underline">
                  limpar
                </Link>
              </div>

              <form method="get" className="space-y-8 border border-line bg-white p-4">
                <input type="hidden" name="ordem" value={sort === "relevance" ? "" : sort} />
                {filters.search && <input type="hidden" name="q" value={filters.search} />}

                {/* Gênero */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Procuro</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {GENDER_OPTIONS.map((o) => (
                      <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="genero"
                          value={o.value}
                          defaultChecked={filters.gender === o.value || (!filters.gender && o.value === "")}
                          className="border-line"
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sinais de confiança */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Sinais de confiança</p>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" name="verified" value="1" defaultChecked={filters.verifiedOnly} />
                    Apenas verificadas
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" name="online" value="1" defaultChecked={filters.onlineOnly} />
                    Online agora
                  </label>
                </div>

                {/* Bairro */}
                {districts.length > 1 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Bairro</p>
                    <select
                      name="bairro"
                      defaultValue={filters.districtSlug ?? ""}
                      className="mt-2 w-full border border-line bg-white px-2 py-2 text-sm outline-none focus:border-foreground"
                    >
                      <option value="">Todos os bairros</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.slug}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-foreground py-3 text-xs font-semibold uppercase tracking-wider text-white"
                >
                  Aplicar ({count.toLocaleString("pt-BR")})
                </button>

                {/* Filtros avançados */}
                <details className="group">
                  <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-wider text-muted group-open:mb-6">
                    Filtros avançados ▾
                  </summary>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Faixa de preço /h</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          name="pmin"
                          defaultValue={filters.priceMin ?? ""}
                          placeholder="mín"
                          className="w-full border border-line px-2 py-2 text-sm"
                        />
                        <input
                          name="pmax"
                          defaultValue={filters.priceMax ?? ""}
                          placeholder="máx"
                          className="w-full border border-line px-2 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Idade</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          name="amin"
                          defaultValue={filters.ageMin ?? ""}
                          placeholder="mín"
                          className="w-full border border-line px-2 py-2 text-sm"
                        />
                        <input
                          name="amax"
                          defaultValue={filters.ageMax ?? ""}
                          placeholder="máx"
                          className="w-full border border-line px-2 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Atendimento</p>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="local"
                          value="1"
                          defaultChecked={filters.hasOwnPlace}
                          className="rounded border-line"
                        />
                        Local próprio
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="domicilio"
                          value="1"
                          defaultChecked={filters.homeVisit}
                          className="rounded border-line"
                        />
                        A domicílio
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full border border-foreground py-2 text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      Aplicar filtros avançados
                    </button>
                  </div>
                </details>
              </form>
              </details>
            </aside>

            {/* ── Results ── */}
            <div>
              <div className="border border-foreground bg-foreground px-4 py-2 text-center text-xs font-medium text-white">
                Perfis com destaque aparecem em primeiro lugar — todos passaram pela mesma verificação.
              </div>
              {view === "list" ? (
                <div className="mt-6 space-y-3">
                  {profiles.map((p) => (
                    <ProfileListRow key={p.id} profile={p} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {profiles.map((p) => (
                    <ProfileCard key={p.id} profile={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

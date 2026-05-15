import Link from "next/link";
import { Suspense } from "react";
import { DiscoverViewToggle } from "@/components/discover/discover-view-toggle";
import { CitySessionSaver } from "@/components/discover/city-session-saver";
import { CitySwitcher } from "@/components/discover/city-switcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileListRow } from "@/components/profile/profile-list-row";
import { buildDiscoverHref, parseDiscoverSearchParams } from "@/lib/discover-params";
import { getOrCreateCityBySlug, listProfilesForCity, listStoriesForCity } from "@/lib/queries";
import { StoryBar } from "@/components/stories/story-bar";
import { auth } from "@/lib/auth";

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

  const city = await getOrCreateCityBySlug(citySlug);

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const [profiles, storyGroups] = await Promise.all([
    listProfilesForCity(city.id, filters, sort),
    listStoriesForCity(city.id, session?.user?.id),
  ]);
  const count = profiles.length;

  const sortLabel =
    sort === "price_asc"
      ? "Menor preço /h"
      : sort === "price_desc"
        ? "Maior preço /h"
        : sort === "rating"
          ? "Melhor avaliação"
          : "Relevância";

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

  return (
    <>
      <SiteHeader activeHref={`/descobrir/${citySlug}`} />
      <CitySessionSaver citySlug={citySlug} />
      <CitySwitcher currentCityName={city.name} citySlug={citySlug} />
      <main className="min-h-screen pb-28">
        {/* ── Header ── */}
        <div className="border-b border-black/[0.06] bg-white/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
              Descobrir / {city.name}
            </p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">
                {city.name} <span className="text-muted font-normal">·</span>{" "}
                <span className="text-[22px] font-normal text-muted sm:text-[26px]">
                  {count.toLocaleString("pt-BR")} perfis
                </span>
              </h1>
              {count > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-lg border border-black/10 bg-white px-3.5 py-[6px] text-[13px] font-medium shadow-sm">
                      {sortLabel}
                    </summary>
                    <ul className="absolute right-0 z-20 mt-1.5 min-w-[180px] rounded-xl border border-black/[0.06] bg-white py-1 text-[13px] shadow-xl overflow-hidden animate-scale-in">
                      {(
                        [
                          ["relevance", "Relevância"],
                          ["price_asc", "Menor preço /h"],
                          ["price_desc", "Maior preço /h"],
                          ["rating", "Melhor avaliação"],
                        ] as const
                      ).map(([value, label]) => (
                        <li key={value}>
                          <Link
                            href={buildDiscoverHref(citySlug, { ordem: value === "relevance" ? null : value }, sp)}
                            className="block px-3.5 py-2 transition-colors hover:bg-black/[0.04]"
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                  <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-lg bg-black/[0.04]" />}>
                    <DiscoverViewToggle citySlug={citySlug} />
                  </Suspense>
                </div>
              )}
            </div>

            {activePills.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {activePills.map((pill) => (
                  <Link
                    key={pill.label}
                    href={pill.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-[4px] text-[12px] font-medium text-foreground transition-colors hover:bg-black/[0.08]"
                  >
                    {pill.label}
                    <span className="text-coral font-bold text-[11px]">×</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stories ── */}
        {storyGroups.length > 0 && (
          <StoryBar groups={storyGroups} isClient={isLoggedIn} />
        )}

        {/* ── Body ── */}
        {count === 0 ? (
          /* ── Empty state ── */
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-md text-center">
              <p className="text-[28px] font-semibold tracking-tight">Ainda não há perfis em {city.name}.</p>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                {activePills.length > 0
                  ? "Nenhum perfil corresponde aos filtros selecionados. Tente remover alguns filtros."
                  : "Seja o primeiro a se cadastrar nessa cidade ou explore outras regiões."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activePills.length > 0 && (
                  <Link
                    href={`/descobrir/${citySlug}`}
                    className="rounded-lg bg-foreground px-5 py-[7px] text-[13px] font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Limpar filtros
                  </Link>
                )}
                <Link
                  href="/buscar"
                  className="rounded-lg border border-black/10 bg-white px-5 py-[7px] text-[13px] font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.98]"
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
                  className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-[7px] text-[14px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-muted/60 hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
                />
                <button type="submit" className="rounded-lg bg-foreground px-4 py-[7px] text-[12px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]">
                  Ir
                </button>
              </form>
              {filters.search && (
                <Link
                  href={`/buscar?q=${encodeURIComponent(filters.search)}`}
                  className="block text-center text-[12px] text-[#0a84ff] transition-colors hover:underline"
                >
                  Buscar em todas as cidades
                </Link>
              )}

              <details className="group lg:open" open>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider shadow-sm lg:hidden">
                  <span>Filtros</span>
                  <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
                </summary>

                <div className="flex items-center justify-between pt-2 lg:pt-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted">Filtros</p>
                  <Link href={`/descobrir/${citySlug}`} className="text-[12px] text-[#0a84ff] transition-colors hover:underline">
                    limpar
                  </Link>
                </div>

                <form method="get" className="space-y-5 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <input type="hidden" name="ordem" value={sort === "relevance" ? "" : sort} />
                  {filters.search && <input type="hidden" name="q" value={filters.search} />}

                  {/* Gênero */}
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Procuro</p>
                    <div className="mt-2.5 flex flex-col gap-2">
                      {GENDER_OPTIONS.map((o) => (
                        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <input
                            type="radio"
                            name="genero"
                            value={o.value}
                            defaultChecked={filters.gender === o.value || (!filters.gender && o.value === "")}
                            className="accent-coral"
                          />
                          {o.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sinais de confiança */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Confiança</p>
                    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                      <input type="checkbox" name="verified" value="1" defaultChecked={filters.verifiedOnly} className="accent-coral rounded" />
                      Apenas verificadas
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                      <input type="checkbox" name="online" value="1" defaultChecked={filters.onlineOnly} className="accent-coral rounded" />
                      Online agora
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-foreground py-[8px] text-[13px] font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Aplicar ({count.toLocaleString("pt-BR")})
                  </button>

                  {/* Filtros avançados */}
                  <details className="group">
                    <summary className="cursor-pointer list-none text-[11px] font-medium uppercase tracking-wider text-muted group-open:mb-4">
                      Avançados ▾
                    </summary>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Preço /h</p>
                        <div className="mt-2 flex gap-2">
                          <input
                            name="pmin"
                            defaultValue={filters.priceMin ?? ""}
                            placeholder="mín"
                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-[6px] text-[13px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]"
                          />
                          <input
                            name="pmax"
                            defaultValue={filters.priceMax ?? ""}
                            placeholder="máx"
                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-[6px] text-[13px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Idade</p>
                        <div className="mt-2 flex gap-2">
                          <input
                            name="amin"
                            defaultValue={filters.ageMin ?? ""}
                            placeholder="mín"
                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-[6px] text-[13px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]"
                          />
                          <input
                            name="amax"
                            defaultValue={filters.ageMax ?? ""}
                            placeholder="máx"
                            className="w-full rounded-lg border border-black/10 bg-white px-3 py-[6px] text-[13px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Atendimento</p>
                        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <input type="checkbox" name="local" value="1" defaultChecked={filters.hasOwnPlace} className="accent-coral rounded" />
                          Local próprio
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <input type="checkbox" name="domicilio" value="1" defaultChecked={filters.homeVisit} className="accent-coral rounded" />
                          A domicílio
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-black/10 bg-white py-[7px] text-[12px] font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.98]"
                      >
                        Aplicar avançados
                      </button>
                    </div>
                  </details>
                </form>
              </details>
            </aside>

            {/* ── Results ── */}
            <div>
              <div className="rounded-lg bg-foreground/90 px-4 py-2 text-center text-[12px] font-medium text-white/90">
                Perfis com destaque aparecem primeiro — todos passaram pela mesma verificação.
              </div>
              {view === "list" ? (
                <div className="mt-6 space-y-3">
                  {profiles.map((p) => (
                    <ProfileListRow key={p.id} profile={p} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

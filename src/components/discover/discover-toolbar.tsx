"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { CitySwitcher } from "./city-switcher";
import { DiscoverViewToggle } from "./discover-view-toggle";
import { FilterDrawer } from "./filter-drawer";
import { FilterChip } from "./filter-chip";
import { buildDiscoverHref } from "@/lib/discover-params";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
    { value: "relevance", label: "Relevância" },
    { value: "price_asc", label: "Menor preço /h" },
    { value: "price_desc", label: "Maior preço /h" },
    { value: "rating", label: "Melhor avaliação" },
] as const;

type DiscoverToolbarProps = {
    citySlug: string;
    cityName: string;
    count: number;
    initialFilters: {
        gender?: "garotos" | "casais" | undefined;
        verifiedOnly?: boolean;
        priceMin?: number | null;
        priceMax?: number | null;
        ageMin?: number | null;
        ageMax?: number | null;
        hasOwnPlace?: boolean;
        homeVisit?: boolean;
    };
    activePills: { label: string; href: string }[];
};

/**
 * DiscoverToolbar — header de Descobrir (Design System v2.3 / Tahoe).
 *
 * Caminho: src/components/discover/discover-toolbar.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Decisão user 2026-05-17: SÓ a cidade é sticky-top. Resto da toolbar
 * (sort, filtros, view, active pills) scrolla com a página.
 *
 * Estrutura:
 *  - Linha 1 (sticky): só CitySwitcher.
 *  - Linha 2 (rola com scroll): sort dropdown + botão Filtros + view toggle.
 *  - Linha 3 (rola): active filter pills (visível só quando há filtros aplicados).
 *
 * Removidos os "chips rápidos" (Verificadas, Local próprio, etc) — viraram
 * filtros dentro do drawer "Filtros avançados". Decisão user 2026-05-17.
 */
export function DiscoverToolbar({
    citySlug,
    cityName,
    count,
    initialFilters,
    activePills,
}: DiscoverToolbarProps) {
    const router = useRouter();
    const sp = useSearchParams();
    const currentSort = sp.get("ordem") ?? "relevance";

    const [sortOpen, setSortOpen] = useState(false);
    const [searchingCity, setSearchingCity] = useState(false);

    function sortHref(value: string): string {
        return buildDiscoverHref(
            citySlug,
            { ordem: value === "relevance" ? null : value },
            sp,
        );
    }

    // searchParams preservados pelo FilterDrawer (genero, q, verified, etc).
    const preservedParams: Record<string, string> = {};
    sp.forEach((value, key) => {
        if (!["pmin", "pmax", "amin", "amax", "local", "domicilio"].includes(key)) {
            preservedParams[key] = value;
        }
    });

    const sortLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label
        ?? "Relevância";

    return (
        <>
            {/* ── Bar sticky: SÓ a cidade ────────────────────────────────── */}
            <div className="glass sticky top-14 z-30 border-b border-line md:top-16">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                    {searchingCity ? (
                        <CitySwitcher
                            currentCityName={cityName}
                            citySlug={citySlug}
                            sticky={false}
                            searching
                            onSearchingChange={setSearchingCity}
                        />
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <CitySwitcher
                                currentCityName={cityName}
                                citySlug={citySlug}
                                sticky={false}
                                searching={false}
                                onSearchingChange={setSearchingCity}
                            />
                            <span className="hidden text-sm text-ink-dim sm:inline">
                                <span className="font-semibold tabular-nums text-ink">
                                    {count.toLocaleString("pt-BR")}
                                </span>{" "}
                                {count === 1 ? "perfil" : "perfis"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bar não-sticky: ações + active pills ─────────────────────── */}
            {!searchingCity && (
                <div className="border-b border-line bg-background/60">
                    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between gap-3">
                            {/* Sort dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setSortOpen((v) => !v)}
                                    aria-expanded={sortOpen}
                                    aria-haspopup="listbox"
                                    className={cn(
                                        "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                                        "border border-line bg-white text-ink-dim",
                                        "transition-all duration-150 ease-[var(--ease-tahoe)]",
                                        "hover:bg-line/40 hover:text-ink hover:border-ink/15",
                                        "active:scale-[0.97]",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                    )}
                                >
                                    {sortLabel}
                                    <ChevronDown
                                        className="h-3.5 w-3.5"
                                        strokeWidth={1.8}
                                        aria-hidden
                                    />
                                </button>

                                {sortOpen && (
                                    <>
                                        <button
                                            type="button"
                                            aria-label="Fechar"
                                            onClick={() => setSortOpen(false)}
                                            className="fixed inset-0 z-40 cursor-default"
                                        />
                                        <ul
                                            role="listbox"
                                            className={cn(
                                                "absolute left-0 z-50 mt-2 min-w-[200px]",
                                                "glass-panel rounded-2xl py-1.5",
                                                "animate-scale-in origin-top-left",
                                            )}
                                        >
                                            {SORT_OPTIONS.map((opt) => {
                                                const active = currentSort === opt.value;
                                                return (
                                                    <li key={opt.value}>
                                                        <button
                                                            role="option"
                                                            aria-selected={active}
                                                            type="button"
                                                            onClick={() => {
                                                                router.push(sortHref(opt.value));
                                                                setSortOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex w-full items-center px-4 py-2 text-base transition-colors",
                                                                active
                                                                    ? "text-rose font-medium"
                                                                    : "text-ink-dim hover:text-ink hover:bg-line/40",
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <FilterDrawer
                                    citySlug={citySlug}
                                    initial={initialFilters}
                                    preservedParams={preservedParams}
                                />

                                <DiscoverViewToggle citySlug={citySlug} />
                            </div>
                        </div>

                        {/* Active filter pills (filtros do drawer aplicados) */}
                        {activePills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {activePills.map((pill) => (
                                    <FilterChip
                                        key={pill.label}
                                        href={pill.href}
                                        removable
                                    >
                                        {pill.label}
                                    </FilterChip>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

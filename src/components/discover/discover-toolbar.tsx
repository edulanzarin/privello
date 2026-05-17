"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
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

const QUICK_CHIPS: {
    key: string;
    label: string;
    /** Chave do searchParam toggleável. */
    paramKey: string;
    /** Valor que ativa o filtro. */
    activeValue: string;
}[] = [
        { key: "verified", label: "Verificadas", paramKey: "verified", activeValue: "1" },
        { key: "local", label: "Local próprio", paramKey: "local", activeValue: "1" },
        { key: "domicilio", label: "A domicílio", paramKey: "domicilio", activeValue: "1" },
        { key: "garotos", label: "Garotos", paramKey: "genero", activeValue: "garotos" },
        { key: "casais", label: "Casais", paramKey: "genero", activeValue: "casais" },
    ];

type DiscoverToolbarProps = {
    citySlug: string;
    cityName: string;
    count: number;
    initialFilters: {
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
 * DiscoverToolbar — header sticky de Descobrir (Design System v2 / Tahoe).
 *
 * Caminho: src/components/discover/discover-toolbar.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Estrutura (de cima pra baixo):
 *  Linha 1: CitySwitcher (esquerda) + sort dropdown + filtros drawer + view toggle (direita).
 *  Linha 2: chips horizontais sticky (verificadas, local, domicilio, garotos, casais).
 *  Linha 3: active filter pills (visível só quando há filtros aplicados).
 *
 * Tudo dentro de um wrapper `glass border-b border-line sticky top-14 md:top-16`.
 *
 * Mobile: chips com scroll-x (lista horizontal não quebra). Filter drawer
 * abre como bottom-sheet em mobile, side em desktop.
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

    function isChipActive(chip: typeof QUICK_CHIPS[number]): boolean {
        return sp.get(chip.paramKey) === chip.activeValue;
    }

    function chipHref(chip: typeof QUICK_CHIPS[number]): string {
        const next: Record<string, string | null> = {};
        next[chip.paramKey] = isChipActive(chip) ? null : chip.activeValue;
        return buildDiscoverHref(citySlug, next, sp);
    }

    function sortHref(value: string): string {
        return buildDiscoverHref(
            citySlug,
            { ordem: value === "relevance" ? null : value },
            sp,
        );
    }

    // searchParams preservados pelo FilterDrawer (gênero, q, ordem, verified...)
    const preservedParams: Record<string, string> = {};
    sp.forEach((value, key) => {
        if (!["pmin", "pmax", "amin", "amax", "local", "domicilio"].includes(key)) {
            preservedParams[key] = value;
        }
    });

    const sortLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label
        ?? "Relevância";

    return (
        <div className="glass sticky top-14 z-30 border-b border-line md:top-16">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                {/* Linha 1: cidade + ações */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <CitySwitcher
                            currentCityName={cityName}
                            citySlug={citySlug}
                            sticky={false}
                        />
                        <span className="hidden text-sm text-ink-dim sm:inline">
                            <span className="font-semibold tabular-nums text-ink">
                                {count.toLocaleString("pt-BR")}
                            </span>{" "}
                            {count === 1 ? "perfil" : "perfis"}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sort dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setSortOpen((v) => !v)}
                                aria-expanded={sortOpen}
                                aria-haspopup="listbox"
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                                    "border border-line bg-white/55 text-ink-dim backdrop-blur-md backdrop-saturate-150",
                                    "transition-all duration-150 ease-[var(--ease-tahoe)]",
                                    "hover:bg-white/75 hover:text-ink hover:border-ink/15",
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
                                            "absolute right-0 z-50 mt-2 min-w-[200px]",
                                            "glass-panel rounded-2xl py-1.5",
                                            "animate-scale-in origin-top-right",
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

                        <FilterDrawer
                            citySlug={citySlug}
                            initial={initialFilters}
                            preservedParams={preservedParams}
                        />

                        <DiscoverViewToggle citySlug={citySlug} />
                    </div>
                </div>

                {/* Linha 2: chips horizontais */}
                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <FilterChip
                        href={`/descobrir/${citySlug}`}
                        active={QUICK_CHIPS.every((c) => !isChipActive(c)) && !sp.get("q")}
                        icon={<Search className="h-3 w-3" strokeWidth={2} aria-hidden />}
                    >
                        Todos
                    </FilterChip>
                    {QUICK_CHIPS.map((chip) => (
                        <FilterChip
                            key={chip.key}
                            href={chipHref(chip)}
                            active={isChipActive(chip)}
                        >
                            {chip.label}
                        </FilterChip>
                    ))}
                </div>

                {/* Linha 3: active filter pills (avançados) */}
                {activePills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
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
    );
}

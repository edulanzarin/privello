"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CitySwitcher } from "./city-switcher";
import { FilterDrawer } from "./filter-drawer";

type DiscoverToolbarProps = {
    citySlug: string;
    cityName: string;
    count: number;
    initialFilters: {
        gender?: "garotos" | "casais" | undefined;
        verifiedOnly?: boolean;
        sort?: "relevance" | "price_asc" | "price_desc" | "rating";
        view?: "grid" | "list";
        priceMin?: number | null;
        priceMax?: number | null;
        ageMin?: number | null;
        ageMax?: number | null;
        hasOwnPlace?: boolean;
        homeVisit?: boolean;
    };
};

/**
 * DiscoverToolbar — header de Descobrir (Design System v2.4 / Tahoe).
 *
 * Caminho: src/components/discover/discover-toolbar.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Decisão user 2026-05-17 (revisão final): toolbar sticky tem APENAS
 * cidade + botão Filtros. Sem sort, sem view toggle, sem chips, sem
 * active pills.
 *
 * Tudo (Procuro / Verificadas / Preço / Idade / Atendimento / Sort / View)
 * vive dentro do drawer "Filtros". O drawer é a fonte única de filtros e
 * ordenação.
 *
 * Quando o user busca cidade (clica no chevron), o autocomplete ocupa
 * largura toda da toolbar, escondendo temporariamente o botão Filtros.
 */
export function DiscoverToolbar({
    citySlug,
    cityName,
    initialFilters,
}: DiscoverToolbarProps) {
    const sp = useSearchParams();
    const [searchingCity, setSearchingCity] = useState(false);

    // searchParams preservados pelo FilterDrawer (apenas `q` agora —
    // gênero, verified, sort, view e os ranges são gerenciados pelo drawer).
    const preservedParams: Record<string, string> = {};
    sp.forEach((value, key) => {
        if (
            ![
                "genero",
                "verified",
                "ordem",
                "view",
                "pmin",
                "pmax",
                "amin",
                "amax",
                "local",
                "domicilio",
            ].includes(key)
        ) {
            preservedParams[key] = value;
        }
    });

    return (
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
                        <FilterDrawer
                            citySlug={citySlug}
                            initial={initialFilters}
                            preservedParams={preservedParams}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

type Props = {
  currentCityName: string;
  citySlug: string;
  /** Quando renderizado dentro do header sticky de Descobrir, esconde o
   * próprio sticky (a pill é parte do header maior). Default `true`
   * preserva o comportamento legado standalone. */
  sticky?: boolean;
};

function displayFromSlug(slug: string, fallback: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return fallback;
  const uf = parts[parts.length - 1].toUpperCase();
  if (fallback.includes(",")) return fallback;
  return `${fallback}, ${uf}`;
}

/**
 * CitySwitcher — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/discover/city-switcher.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Pílula glass clicável que mostra a cidade atual com chevron. Ao clicar,
 * expande pra autocomplete de cidade. Quando `sticky=false`, é renderizada
 * inline no header de Descobrir (modo recomendado).
 *
 * Props:
 *  - `currentCityName`: nome legível (vem do server).
 *  - `citySlug`: slug usado pra inferir UF.
 *  - `sticky?` (default true): se true, renderiza com wrapper sticky standalone.
 *    Em Descobrir v2, passar `false` pra integrar no header.
 *
 * Side effects:
 *  - `sessionStorage.setItem(LAST_CITY_KEY, slug)` ao trocar.
 *  - `router.push(/descobrir/[slug])`.
 */
export function CitySwitcher({ currentCityName, citySlug, sticky = true }: Props) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);

  const displayName = displayFromSlug(citySlug, currentCityName);

  const inner = (
    <div className="flex items-center gap-2">
      {searching ? (
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <div className="flex-1 min-w-0">
            <CityAutocomplete
              initialLabel=""
              onSelect={(slug) => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(LAST_CITY_KEY, slug);
                }
                setSearching(false);
                router.push(`/descobrir/${slug}`);
              }}
              compact
            />
          </div>
          <button
            onClick={() => setSearching(false)}
            className="shrink-0 rounded-full p-1.5 text-ink-dim transition-colors hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
            aria-label="Cancelar troca de cidade"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setSearching(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
            "text-base font-medium text-ink",
            "border border-line bg-white/55 backdrop-blur-md backdrop-saturate-150",
            "transition-all duration-150 ease-[var(--ease-tahoe)]",
            "hover:bg-white/75 hover:border-ink/15",
            "active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <MapPin className="h-3.5 w-3.5 text-rose" strokeWidth={2} />
          <span>{displayName}</span>
          <ChevronDown
            className="h-3 w-3 text-ink-dim"
            strokeWidth={2}
          />
        </button>
      )}
    </div>
  );

  if (!sticky) return inner;

  return (
    <div className="sticky top-14 z-30 glass border-b border-line md:top-16">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">{inner}</div>
    </div>
  );
}

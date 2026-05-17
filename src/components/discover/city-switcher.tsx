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
  /** Quando true, renderiza wrapper sticky standalone. Default false em Descobrir. */
  sticky?: boolean;
  /** Modo controlado: callback acionado ao entrar/sair do estado de busca.
   * Permite a toolbar pai esconder outros controles e dar largura full
   * pro autocomplete enquanto o user busca cidade. */
  onSearchingChange?: (searching: boolean) => void;
  /** Modo controlado externamente (sobrescreve estado interno). */
  searching?: boolean;
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
 * Pílula clicável (sólida, não glass) que mostra a cidade atual com chevron.
 * Ao clicar, expande pra autocomplete. Suporta modo controlado externamente
 * via `searching` + `onSearchingChange` — usado em DiscoverToolbar pra dar
 * largura full ao autocomplete (esconder sort/filtros enquanto busca).
 *
 * Props:
 *  - `currentCityName`: nome legível (vem do server).
 *  - `citySlug`: slug usado pra inferir UF.
 *  - `sticky?` (default true): se true, wrapper sticky standalone.
 *  - `onSearchingChange?`: callback de mudança de estado.
 *  - `searching?`: modo controlado (sobrescreve estado interno).
 *
 * Side effects:
 *  - `sessionStorage.setItem(LAST_CITY_KEY, slug)` ao trocar.
 *  - `router.push(/descobrir/[slug])`.
 */
export function CitySwitcher({
  currentCityName,
  citySlug,
  sticky = true,
  onSearchingChange,
  searching: searchingProp,
}: Props) {
  const router = useRouter();
  const [internalSearching, setInternalSearching] = useState(false);
  const isControlled = searchingProp !== undefined;
  const searching = isControlled ? searchingProp : internalSearching;

  function setSearching(value: boolean) {
    if (!isControlled) setInternalSearching(value);
    onSearchingChange?.(value);
  }

  const displayName = displayFromSlug(citySlug, currentCityName);

  const inner = searching ? (
    <div className="flex w-full items-center gap-2 rounded-full border border-line bg-white px-3 py-1">
      <MapPin
        className="h-4 w-4 shrink-0 text-rose"
        strokeWidth={2}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
        aria-label="Cancelar troca de cidade"
      >
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  ) : (
    <button
      onClick={() => setSearching(true)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
        "text-base font-semibold text-ink",
        "border border-line bg-white",
        "transition-all duration-150 ease-[var(--ease-tahoe)]",
        "hover:bg-line/40 hover:border-ink/15",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <MapPin className="h-3.5 w-3.5 text-rose" strokeWidth={2} aria-hidden />
      <span>{displayName}</span>
      <ChevronDown
        className="h-3 w-3 text-ink-dim"
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );

  if (!sticky) return inner;

  return (
    <div className="sticky top-14 z-30 glass border-b border-line md:top-16">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">{inner}</div>
    </div>
  );
}

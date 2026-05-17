"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MapPin, X, ChevronDown } from "lucide-react";

export const REELS_CITY_KEY = "privello:reelsCitySlug";

type City = { id: string; name: string; slug: string };

type Props = {
  cities: City[];
  currentSlug?: string;
};

function cityLabel(city: City) {
  // Derive UF from last segment of slug: "sao-paulo-sp" → "SP"
  const parts = city.slug.split("-");
  const uf = parts[parts.length - 1].toUpperCase();
  // Sanity check: UF is 2 letters
  if (/^[A-Z]{2}$/.test(uf)) return `${city.name}, ${uf}`;
  return city.name;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Filtro de cidade compacto sobreposto ao header da página de Reels.
 *
 * Props:
 * - `cities` (City[]): lista de cidades com reels disponíveis (vem de `getCitiesWithReels`).
 * - `currentSlug?` (string): slug ativo (mostra label da cidade no botão; sem ele, mostra "Todas as cidades").
 *
 * Consumidores conhecidos:
 * - src/app/reels/page.tsx
 *
 * Side effects:
 * - `sessionStorage.setItem/removeItem(REELS_CITY_KEY, slug)` para persistir a escolha.
 * - `router.push("/reels?cidade=...")` para navegar com o novo filtro.
 * - Listener `mousedown` global para fechar o dropdown ao clicar fora.
 */
export function ReelsCityFilter({ cities, currentSlug }: Props) {
  const router = useRouter();
  const currentCity = cities.find((c) => c.slug === currentSlug);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim().length === 0
    ? cities
    : cities.filter((c) =>
      normalize(c.name).includes(normalize(query)),
    );

  function select(city: City) {
    setQuery("");
    setOpen(false);
    sessionStorage.setItem(REELS_CITY_KEY, city.slug);
    router.push(`/reels?cidade=${city.slug}`);
  }

  function clearFilter() {
    setQuery("");
    setOpen(false);
    sessionStorage.removeItem(REELS_CITY_KEY);
    router.push("/reels");
  }

  function openDropdown() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={openDropdown}
        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition hover:border-white/40"
      >
        <MapPin className="h-3 w-3 shrink-0 text-white/60" strokeWidth={1.5} />
        <span className="max-w-[130px] truncate">
          {currentCity ? cityLabel(currentCity) : "Todas as cidades"}
        </span>
        {currentCity ? (
          <X
            className="h-3 w-3 text-white/60 hover:text-white"
            strokeWidth={2}
            onClick={(e) => { e.stopPropagation(); clearFilter(); }}
          />
        ) : (
          <ChevronDown className="h-3 w-3 text-white/60" strokeWidth={2} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-white/40" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cidade…"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-white/40"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="h-3.5 w-3.5 text-white/40 hover:text-white" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* City list */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {/* "All cities" option */}
            <li>
              <button
                type="button"
                onClick={clearFilter}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-white/10 ${!currentSlug ? "text-coral font-semibold" : "text-white/70"}`}
              >
                Todas as cidades
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-white/40">Nenhuma cidade encontrada</li>
            ) : (
              filtered.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => select(city)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-white/10 ${city.slug === currentSlug ? "text-coral font-semibold" : "text-white"}`}
                  >
                    <MapPin className="h-3 w-3 shrink-0 text-white/30" strokeWidth={1.5} />
                    {cityLabel(city)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

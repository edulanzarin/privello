"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Users } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

type GenderOption = { value: string; label: string };

const GENDER_OPTIONS: GenderOption[] = [
  { value: "", label: "Garotas" },
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
];

/**
 * Search bar do hero da home — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/marketing/hero-search-form.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6.
 *
 * Visual:
 *  - `.glass-pill` grande (rounded-full).
 *  - Em desktop: 3 colunas (cidade autocomplete | gênero select | botão).
 *  - Em mobile: 2 linhas (campos empilhados, botão full-width na 2ª linha).
 *  - Botão "Descobrir" rose (ação primária, marca).
 *  - Ícones MapPin / Users em `text-ink-dim`.
 *  - Divider vertical hairline `border-line` entre colunas (desktop).
 *
 * Comportamento:
 *  - Submit navega pra `/descobrir/[citySlug]?genero=...`.
 *  - Sem cidade selecionada → fallback `sao-paulo-sp`.
 *  - `sessionStorage` salva LAST_CITY_KEY pro bottom-nav restaurar.
 */
export function HeroSearchForm() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("");
  const [gender, setGender] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = citySlug || "sao-paulo-sp";
    if (slug && typeof window !== "undefined") {
      sessionStorage.setItem(LAST_CITY_KEY, slug);
    }
    const p = new URLSearchParams();
    if (gender) p.set("genero", gender);
    const q = p.toString();
    router.push(q ? `/descobrir/${slug}?${q}` : `/descobrir/${slug}`);
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "glass-pill flex flex-col items-stretch gap-2 p-2",
        "md:flex-row md:items-center md:gap-0 md:p-1.5",
        "shadow-[var(--shadow-md)]",
      )}
    >
      {/* Cidade */}
      <div className="flex flex-1 items-center gap-3 px-3 py-2 md:py-2.5 md:px-4">
        <MapPin
          className="h-4 w-4 shrink-0 text-ink-dim"
          strokeWidth={1.8}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="block text-2xs font-medium uppercase tracking-wider text-ink-dim">
            Cidade
          </span>
          <CityAutocomplete onSelect={(slug) => setCitySlug(slug)} />
        </div>
      </div>

      {/* Divider desktop / gap mobile */}
      <div className="hidden h-8 w-px bg-line md:block" aria-hidden />

      {/* Gênero */}
      <label className="flex flex-1 items-center gap-3 px-3 py-2 md:py-2.5 md:px-4 cursor-pointer">
        <Users
          className="h-4 w-4 shrink-0 text-ink-dim"
          strokeWidth={1.8}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-2xs font-medium uppercase tracking-wider text-ink-dim">
            Procuro
          </span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-0.5 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-md font-medium text-ink outline-none focus:ring-0"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </span>
      </label>

      {/* Botão */}
      <button
        type="submit"
        className={cn(
          "flex items-center justify-center gap-2 rounded-full bg-rose px-6 py-3 md:py-2.5",
          "text-md font-semibold text-white",
          "shadow-[var(--shadow-sm)]",
          "transition-all duration-150 ease-[var(--ease-tahoe)]",
          "hover:brightness-105 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "md:min-w-[160px]",
        )}
      >
        <Search className="h-4 w-4" strokeWidth={2} />
        Descobrir
      </button>
    </form>
  );
}

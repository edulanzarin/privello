"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Users, ChevronDown } from "lucide-react";
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
 * Search bar do hero da home — Design System v2.1 (Tahoe Sensual, calibrado).
 *
 * Caminho: src/components/marketing/hero-search-form.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6.
 *
 * Visual (após calibração 2026-05-17 baseada em feedback do user):
 *  - Card glass-panel rounded-2xl (não pill full — feedback "arredondamento de mais").
 *  - Sem labels uppercase CIDADE/PROCURO (feedback "feio").
 *  - Sem ícone MapPin duplicado (CityAutocomplete em modo `compact`).
 *  - Container bem mais opaco (rgba 0.82 via .glass-panel).
 *  - Mobile empilha 3 linhas (cidade / gênero / botão full-width).
 *  - Desktop horizontal: cidade flex-1 | divider | gênero | botão.
 *  - Botão "Descobrir" rose com font-semibold maior contraste.
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
        "glass-panel rounded-2xl p-2",
        "flex flex-col gap-2",
        "md:flex-row md:items-stretch md:gap-0 md:p-1.5",
        "shadow-[var(--shadow-md)]",
      )}
    >
      {/* Cidade */}
      <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-white/60 px-3.5 py-2 md:rounded-lg md:bg-transparent md:hover:bg-white/40 transition-colors">
        <MapPin
          className="h-4 w-4 shrink-0 text-ink-dim"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <CityAutocomplete
            onSelect={(slug) => setCitySlug(slug)}
            compact
          />
        </div>
      </div>

      {/* Divider desktop */}
      <div className="hidden h-auto w-px self-stretch bg-line md:block" aria-hidden />

      {/* Gênero */}
      <label className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl bg-white/60 px-3.5 py-2 md:rounded-lg md:bg-transparent md:hover:bg-white/40 transition-colors md:max-w-[220px]">
        <Users
          className="h-4 w-4 shrink-0 text-ink-dim"
          strokeWidth={2}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-dim">Procuro</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-md font-semibold text-ink outline-none focus:ring-0"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-ink-dim md:hidden"
          strokeWidth={2}
          aria-hidden
        />
      </label>

      {/* Botão */}
      <button
        type="submit"
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl bg-rose px-6 py-3",
          "text-md font-semibold text-white",
          "shadow-[var(--shadow-sm)]",
          "transition-all duration-150 ease-[var(--ease-tahoe)]",
          "hover:brightness-105 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "md:min-w-[150px]",
        )}
      >
        <Search className="h-4 w-4" strokeWidth={2.4} />
        Descobrir
      </button>
    </form>
  );
}

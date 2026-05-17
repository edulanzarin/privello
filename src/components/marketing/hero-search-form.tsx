"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Users, ChevronDown } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";
import { SearchBar, SearchField, SearchSubmit } from "@/components/ui/search-bar";

type GenderOption = { value: string; label: string };

const GENDER_OPTIONS: GenderOption[] = [
  { value: "", label: "Garotas" },
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
];

/**
 * HeroSearchForm — search bar primária da Home + Descobrir hub.
 *
 * Caminho: src/components/marketing/hero-search-form.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6.
 *
 * v2.6 (2026-05-17): visual extraído para o primitivo `<SearchBar>` em
 * `components/ui/search-bar.tsx`, garantindo que toda search bar do produto
 * compartilhe o mesmo shell glass + dividers + tipografia. Aqui sobra só
 * a configuração do form (cidade + procuro + CTA Descobrir).
 *
 * Consumidores:
 *  - src/app/page.tsx (Home)
 *  - src/app/descobrir/page.tsx (Hub sem cidade)
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
    <SearchBar onSubmit={submit}>
      <SearchField icon={MapPin}>
        <CityAutocomplete onSelect={(slug) => setCitySlug(slug)} compact />
      </SearchField>

      <SearchField
        icon={Users}
        label="Procuro"
        className="md:max-w-[220px]"
        divider={false}
      >
        <span className="flex items-center gap-2">
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
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-ink-dim md:hidden"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </SearchField>

      <SearchSubmit>
        <Search className="h-4 w-4" strokeWidth={2.4} />
        Descobrir
      </SearchSubmit>
    </SearchBar>
  );
}

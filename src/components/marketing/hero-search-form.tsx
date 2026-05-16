"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";

type GenderOption = { value: string; label: string };

const GENDER_OPTIONS: GenderOption[] = [
  { value: "", label: "Garotas" },
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
];

export function HeroSearchForm() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("");
  const [gender, setGender] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = citySlug || "sao-paulo-sp";
    if (slug) sessionStorage.setItem(LAST_CITY_KEY, slug);
    const p = new URLSearchParams();
    if (gender) p.set("genero", gender);
    const q = p.toString();
    router.push(q ? `/descobrir/${slug}?${q}` : `/descobrir/${slug}`);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/[0.08] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="grid gap-px bg-black/[0.06] md:grid-cols-[1.5fr_1fr_auto] [&>*:first-child]:rounded-tl-2xl [&>*:first-child]:rounded-tr-2xl md:[&>*:first-child]:rounded-tr-none md:[&>*:first-child]:rounded-bl-2xl [&>*:last-child]:rounded-bl-2xl [&>*:last-child]:rounded-br-2xl md:[&>*:last-child]:rounded-bl-none md:[&>*:last-child]:rounded-tr-2xl">
        {/* Cidade — autocomplete IBGE */}
        <CityAutocomplete
          onSelect={(slug) => setCitySlug(slug)}
        />

        {/* Gênero */}
        <label className="flex items-center gap-3 bg-white px-4 py-3">
          <Users className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
          <span className="w-full">
            <span className="block text-xs font-medium text-muted">Procuro</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-0.5 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-md font-medium outline-none focus:ring-0"
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-foreground px-6 py-4 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] md:min-w-[140px] md:rounded-r-2xl"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          Descobrir
        </button>
      </div>
    </form>
  );
}

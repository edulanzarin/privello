"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";

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
    const slug = citySlug || "sao-paulo";
    const p = new URLSearchParams();
    if (gender) p.set("genero", gender);
    const q = p.toString();
    router.push(q ? `/descobrir/${slug}?${q}` : `/descobrir/${slug}`);
  };

  return (
    <form onSubmit={submit} className="border border-line bg-white shadow-sm">
      <div className="grid gap-px bg-line md:grid-cols-[1.5fr_1fr_auto]">
        {/* Cidade — autocomplete IBGE */}
        <CityAutocomplete
          onSelect={(slug) => setCitySlug(slug)}
        />

        {/* Gênero */}
        <label className="flex items-center gap-3 bg-white px-4 py-3">
          <Users className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
          <span className="w-full">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Procuro</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-0.5 w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium outline-none focus:ring-0"
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
          className="flex items-center justify-center gap-2 bg-foreground px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white md:min-w-[140px]"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          Descobrir
        </button>
      </div>
    </form>
  );
}

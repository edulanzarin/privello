"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";
import { Users, Search } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "", label: "Garotas" },
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
];

export function BuscarForm() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("");
  const [gender, setGender] = useState("");
  const [topCities, setTopCities] = useState<{ slug: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/top-cities")
      .then((r) => r.json())
      .then((data) => setTopCities(data.cities ?? []))
      .catch(() => { });
  }, []);

  function handleCitySearch() {
    if (!citySlug) return;
    sessionStorage.setItem(LAST_CITY_KEY, citySlug);
    const p = new URLSearchParams();
    if (gender) p.set("genero", gender);
    const q = p.toString();
    router.push(q ? `/descobrir/${citySlug}?${q}` : `/descobrir/${citySlug}`);
  }

  return (
    <div className="space-y-5">
      {/* Search form - same style as home */}
      <div className="rounded-2xl border border-black/[0.08] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="grid gap-px bg-black/[0.06] md:grid-cols-[1.5fr_1fr] [&>*:first-child]:rounded-tl-2xl [&>*:first-child]:rounded-tr-2xl md:[&>*:first-child]:rounded-tr-none md:[&>*:first-child]:rounded-bl-2xl [&>*:last-child]:rounded-bl-2xl [&>*:last-child]:rounded-br-2xl md:[&>*:last-child]:rounded-bl-none md:[&>*:last-child]:rounded-tr-2xl">
          <CityAutocomplete onSelect={(slug) => setCitySlug(slug)} />

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
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={handleCitySearch}
        disabled={!citySlug}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3 text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
      >
        <Search className="h-4 w-4" strokeWidth={2} />
        Buscar acompanhantes
      </button>

      {/* Top cities */}
      {topCities.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-medium text-muted">Cidades com mais perfis</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topCities.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  sessionStorage.setItem(LAST_CITY_KEY, c.slug);
                  router.push(`/descobrir/${c.slug}`);
                }}
                className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-black/[0.03]"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

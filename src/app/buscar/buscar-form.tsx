"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";
import { Users, AtSign } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "", label: "Garotas" },
  { value: "garotos", label: "Garotos" },
  { value: "casais", label: "Casais" },
];

export function BuscarForm() {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState("");
  const [gender, setGender] = useState("");
  const [handle, setHandle] = useState("");
  const handleRef = useRef<HTMLInputElement>(null);

  function handleCitySearch() {
    if (!citySlug) return;
    sessionStorage.setItem(LAST_CITY_KEY, citySlug);
    const p = new URLSearchParams();
    if (gender) p.set("genero", gender);
    const q = p.toString();
    router.push(q ? `/descobrir/${citySlug}?${q}` : `/descobrir/${citySlug}`);
  }

  function handleAtSearch(e: React.FormEvent) {
    e.preventDefault();
    const clean = handle.trim().replace(/^@/, "").toLowerCase();
    if (!clean) return;
    router.push(`/p/${clean}`);
  }

  const inp = "w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground transition";

  return (
    <div className="space-y-6">
      {/* ── Busca por cidade ── */}
      <div className="space-y-3">
        <div className="border border-line bg-white">
          <CityAutocomplete onSelect={(slug) => setCitySlug(slug)} />
        </div>

        <div className="border border-line bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
            <span className="w-full">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Procuro</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-0.5 w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium outline-none focus:ring-0"
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </span>
          </div>
        </div>

        <button
          onClick={handleCitySearch}
          disabled={!citySlug}
          className="w-full bg-coral py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-40"
        >
          Buscar acompanhantes
        </button>
      </div>

      {/* ── Divisor ── */}
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">ou busque por @</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* ── Busca por @handle ── */}
      <form onSubmit={handleAtSearch} className="space-y-3">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <AtSign className="h-4 w-4 text-muted" strokeWidth={1.5} />
          </span>
          <input
            ref={handleRef}
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
            placeholder="perfil"
            className={`${inp} pl-10`}
            autoComplete="off"
            autoCapitalize="none"
          />
        </div>
        <button
          type="submit"
          disabled={!handle.trim()}
          className="w-full border border-foreground bg-white py-3 text-sm font-bold uppercase tracking-wider text-foreground transition hover:bg-foreground hover:text-white disabled:opacity-40"
        >
          Ir para o perfil
        </button>
      </form>

      {/* ── Cidades populares ── */}
      <div className="pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Cidades populares</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { slug: "sao-paulo-sp",        label: "São Paulo" },
            { slug: "rio-de-janeiro-rj",    label: "Rio de Janeiro" },
            { slug: "curitiba-pr",          label: "Curitiba" },
            { slug: "belo-horizonte-mg",    label: "Belo Horizonte" },
            { slug: "florianopolis-sc",     label: "Florianópolis" },
            { slug: "porto-alegre-rs",      label: "Porto Alegre" },
            { slug: "brasilia-df",          label: "Brasília" },
            { slug: "salvador-ba",          label: "Salvador" },
          ].map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                sessionStorage.setItem(LAST_CITY_KEY, c.slug);
                router.push(`/descobrir/${c.slug}`);
              }}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted transition hover:border-foreground/30 hover:text-foreground"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

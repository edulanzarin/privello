"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Users, ArrowRight } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

/**
 * DiscoverHubForm — formulário do hub `/descobrir` (sem cidade).
 *
 * Caminho: src/app/descobrir/discover-hub-form.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6 (search bar pattern), §14.
 *
 * Substitui `BuscarForm` (de `/buscar`, eliminada). Mesma função:
 *  - CityAutocomplete + Procuro select (Garotas/Garotos/Casais)
 *  - CTA rose "Buscar acompanhantes"
 *  - Top cities pílulas glass abaixo
 *  - + busca global por nome / @handle (segunda search bar)
 *
 * Visual v2:
 *  - Card branco border-line + shadow-sm.
 *  - Inputs sólidos (steering §3.6: forms NÃO usam glass).
 *  - SegmentedButton para Procuro (steering §14.2).
 *  - CTA rose padrão.
 */

const GENDER_OPTIONS = [
    { value: "", label: "Garotas" },
    { value: "garotos", label: "Garotos" },
    { value: "casais", label: "Casais" },
];

export function DiscoverHubForm() {
    const router = useRouter();
    const [citySlug, setCitySlug] = useState("");
    const [gender, setGender] = useState("");
    const [globalQuery, setGlobalQuery] = useState("");
    const [topCities, setTopCities] = useState<{ slug: string; label: string }[]>(
        [],
    );

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
        const qs = p.toString();
        router.push(qs ? `/descobrir/${citySlug}?${qs}` : `/descobrir/${citySlug}`);
    }

    function handleGlobalSearch(e: React.FormEvent) {
        e.preventDefault();
        const term = globalQuery.trim();
        if (term.length < 2) return;
        router.push(`/descobrir?q=${encodeURIComponent(term)}`);
    }

    return (
        <div className="space-y-8">
            {/* ── Bloco 1: escolha de cidade ─────────────────────────────── */}
            <div>
                <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Por cidade
                </h2>

                <div className="mt-3 rounded-2xl border border-line bg-white shadow-[var(--shadow-sm)]">
                    <div className="grid divide-y divide-line md:grid-cols-[1.5fr_1fr] md:divide-y-0 md:divide-x">
                        <CityAutocomplete onSelect={(slug) => setCitySlug(slug)} />

                        <label className="flex items-center gap-3 px-4 py-3">
                            <Users
                                className="h-4 w-4 shrink-0 text-ink-dim"
                                strokeWidth={2}
                            />
                            <span className="w-full">
                                <span className="block text-2xs font-semibold uppercase tracking-wider text-ink-dim">
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
                    </div>
                </div>

                <button
                    onClick={handleCitySearch}
                    disabled={!citySlug}
                    className={cn(
                        "mt-3 inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose px-5 py-2.5 text-md font-semibold text-white shadow-[var(--shadow-sm)]",
                        "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
                        "hover:brightness-105 active:brightness-95",
                        "disabled:opacity-40 disabled:hover:brightness-100",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                >
                    <Search className="h-4 w-4" strokeWidth={2.4} />
                    Buscar acompanhantes
                </button>

                {topCities.length > 0 && (
                    <div className="mt-5">
                        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                            Cidades com mais perfis
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {topCities.map((c) => (
                                <button
                                    key={c.slug}
                                    onClick={() => {
                                        sessionStorage.setItem(LAST_CITY_KEY, c.slug);
                                        router.push(`/descobrir/${c.slug}`);
                                    }}
                                    className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-rose-soft hover:text-rose hover:border-rose/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    {c.label}
                                    <ArrowRight
                                        className="ml-1 h-3 w-3"
                                        strokeWidth={2.4}
                                        aria-hidden
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Divisor ───────────────────────────────────────────────── */}
            <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    ou
                </span>
                <div className="h-px flex-1 bg-line" />
            </div>

            {/* ── Bloco 2: busca global por nome / @handle ──────────────── */}
            <div>
                <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Por nome ou @handle
                </h2>
                <form onSubmit={handleGlobalSearch} className="mt-3 flex gap-2">
                    <input
                        type="search"
                        value={globalQuery}
                        onChange={(e) => setGlobalQuery(e.target.value)}
                        placeholder="Nome ou @handle em qualquer cidade…"
                        className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-md text-ink shadow-[var(--shadow-sm)] outline-none transition-all placeholder:text-ink-faint hover:border-ink/15 focus-visible:border-rose focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    />
                    <button
                        type="submit"
                        disabled={globalQuery.trim().length < 2}
                        className={cn(
                            "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-base font-semibold text-ink shadow-[var(--shadow-sm)]",
                            "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
                            "hover:bg-line/30",
                            "disabled:opacity-40 disabled:hover:bg-white",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        )}
                    >
                        Buscar
                    </button>
                </form>
            </div>
        </div>
    );
}

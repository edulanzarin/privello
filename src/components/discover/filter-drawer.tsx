"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterDrawerProps = {
    citySlug: string;
    initial: {
        priceMin?: number | null;
        priceMax?: number | null;
        ageMin?: number | null;
        ageMax?: number | null;
        hasOwnPlace?: boolean;
        homeVisit?: boolean;
    };
    /** searchParams atuais pra preservar `genero`, `q`, `verified`, etc. ao aplicar. */
    preservedParams: Record<string, string>;
};

/**
 * FilterDrawer — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/discover/filter-drawer.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Botão "Filtros" no header sticky de Descobrir abre drawer com filtros
 * avançados (preço, idade, atendimento). Mobile = bottom-sheet (slide up),
 * desktop = side drawer da direita.
 *
 * Acessibilidade:
 *  - role="dialog" aria-modal="true".
 *  - Fecha com Escape e clique no backdrop.
 *  - Touch target ≥ 44×44 nos controles.
 *
 * Comportamento:
 *  - Ao "Aplicar", monta querystring com filtros + preservedParams e
 *    `router.push(/descobrir/[citySlug]?...)`.
 *  - "Limpar" remove todos os filtros avançados, mantém os preservados.
 */
export function FilterDrawer({
    citySlug,
    initial,
    preservedParams,
}: FilterDrawerProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const [priceMin, setPriceMin] = useState(initial.priceMin?.toString() ?? "");
    const [priceMax, setPriceMax] = useState(initial.priceMax?.toString() ?? "");
    const [ageMin, setAgeMin] = useState(initial.ageMin?.toString() ?? "");
    const [ageMax, setAgeMax] = useState(initial.ageMax?.toString() ?? "");
    const [hasOwnPlace, setHasOwnPlace] = useState(!!initial.hasOwnPlace);
    const [homeVisit, setHomeVisit] = useState(!!initial.homeVisit);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    function apply() {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(preservedParams)) {
            if (v) sp.set(k, v);
        }
        if (priceMin) sp.set("pmin", priceMin);
        else sp.delete("pmin");
        if (priceMax) sp.set("pmax", priceMax);
        else sp.delete("pmax");
        if (ageMin) sp.set("amin", ageMin);
        else sp.delete("amin");
        if (ageMax) sp.set("amax", ageMax);
        else sp.delete("amax");
        if (hasOwnPlace) sp.set("local", "1");
        else sp.delete("local");
        if (homeVisit) sp.set("domicilio", "1");
        else sp.delete("domicilio");
        const q = sp.toString();
        router.push(q ? `/descobrir/${citySlug}?${q}` : `/descobrir/${citySlug}`);
        setOpen(false);
    }

    function clearAdvanced() {
        setPriceMin("");
        setPriceMax("");
        setAgeMin("");
        setAgeMax("");
        setHasOwnPlace(false);
        setHomeVisit(false);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2",
                    "text-sm font-medium text-ink-dim",
                    "border border-line bg-white ",
                    "transition-all duration-150 ease-[var(--ease-tahoe)]",
                    "hover:bg-line/40 hover:text-ink hover:border-ink/15",
                    "active:scale-[0.97]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
            >
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
                Filtros
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Filtros avançados"
                >
                    <button
                        type="button"
                        aria-label="Fechar filtros"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-md"
                    />

                    <aside
                        className={cn(
                            "relative flex w-full flex-col gap-5 glass-panel",
                            // Mobile: bottom-sheet — pb extra reserva espaço pra
                            // BottomNav flutuante (pill em bottom-4 + ~56px).
                            "rounded-t-3xl rounded-b-none px-5 pt-6 pb-28",
                            "max-h-[85vh] overflow-y-auto",
                            // Desktop: side drawer
                            "md:max-w-md md:rounded-l-3xl md:rounded-r-none md:rounded-t-3xl",
                            "md:max-h-screen md:py-8 md:pb-8",
                            "animate-fade-in",
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold tracking-tight text-ink">
                                Filtros avançados
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Fechar"
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-dim hover:bg-line/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                            >
                                <X className="h-5 w-5" strokeWidth={1.8} />
                            </button>
                        </div>

                        {/* Preço */}
                        <div>
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                Preço por hora
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="mín"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    prefix="R$"
                                    aria-label="Preço mínimo"
                                />
                                <Input
                                    type="number"
                                    placeholder="máx"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    prefix="R$"
                                    aria-label="Preço máximo"
                                />
                            </div>
                        </div>

                        {/* Idade */}
                        <div>
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                Idade
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="mín"
                                    value={ageMin}
                                    onChange={(e) => setAgeMin(e.target.value)}
                                    aria-label="Idade mínima"
                                />
                                <Input
                                    type="number"
                                    placeholder="máx"
                                    value={ageMax}
                                    onChange={(e) => setAgeMax(e.target.value)}
                                    aria-label="Idade máxima"
                                />
                            </div>
                        </div>

                        {/* Atendimento */}
                        <div>
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                Atendimento
                            </p>
                            <div className="flex flex-col gap-2">
                                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 transition-colors hover:bg-white">
                                    <input
                                        type="checkbox"
                                        checked={hasOwnPlace}
                                        onChange={(e) => setHasOwnPlace(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-md text-ink">Local próprio</span>
                                </label>
                                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 transition-colors hover:bg-white">
                                    <input
                                        type="checkbox"
                                        checked={homeVisit}
                                        onChange={(e) => setHomeVisit(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-md text-ink">A domicílio</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-auto flex gap-3 pt-4">
                            <Button
                                variant="secondary"
                                onClick={clearAdvanced}
                                className="flex-1"
                            >
                                Limpar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={apply}
                                className="flex-1"
                            >
                                Aplicar
                            </Button>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}

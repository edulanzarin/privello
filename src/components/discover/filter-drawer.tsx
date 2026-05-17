"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterDrawerProps = {
    citySlug: string;
    initial: {
        gender?: "garotos" | "casais" | undefined;
        verifiedOnly?: boolean;
        sort?: "relevance" | "price_asc" | "price_desc" | "rating";
        view?: "grid" | "list";
        priceMin?: number | null;
        priceMax?: number | null;
        ageMin?: number | null;
        ageMax?: number | null;
        hasOwnPlace?: boolean;
        homeVisit?: boolean;
    };
    /** searchParams atuais pra preservar `q` e outros não-filtráveis aqui. */
    preservedParams: Record<string, string>;
};

const GENDER_OPTIONS: { value: "" | "garotos" | "casais"; label: string }[] = [
    { value: "", label: "Garotas" },
    { value: "garotos", label: "Garotos" },
    { value: "casais", label: "Casais" },
];

const SORT_OPTIONS = [
    { value: "relevance", label: "Relevância" },
    { value: "price_asc", label: "Menor preço" },
    { value: "price_desc", label: "Maior preço" },
    { value: "rating", label: "Avaliação" },
] as const;

/**
 * FilterDrawer — Design System v2.4 (Tahoe Sensual).
 *
 * Caminho: src/components/discover/filter-drawer.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3.
 *
 * Botão "Filtros" abre drawer com TUDO (decisão user 2026-05-17 final):
 *  - Procuro (Garotas/Garotos/Casais).
 *  - Apenas verificadas.
 *  - Preço por hora — range.
 *  - Idade — range.
 *  - Atendimento (Local próprio, A domicílio).
 *  - Ordenar (Relevância/Menor preço/Maior preço/Avaliação).
 *  - Visualizar (Grade/Lista).
 *
 * Mobile = bottom-sheet (slide up, pb-28 reserva BottomNav).
 * Desktop = side drawer da direita.
 */
export function FilterDrawer({
    citySlug,
    initial,
    preservedParams,
}: FilterDrawerProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const [gender, setGender] = useState<"" | "garotos" | "casais">(initial.gender ?? "");
    const [verifiedOnly, setVerifiedOnly] = useState(!!initial.verifiedOnly);
    const [sort, setSort] = useState<"relevance" | "price_asc" | "price_desc" | "rating">(
        initial.sort ?? "relevance",
    );
    const [view, setView] = useState<"grid" | "list">(initial.view ?? "grid");
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
        if (gender) sp.set("genero", gender);
        else sp.delete("genero");
        if (verifiedOnly) sp.set("verified", "1");
        else sp.delete("verified");
        if (sort !== "relevance") sp.set("ordem", sort);
        else sp.delete("ordem");
        if (view === "list") sp.set("view", "list");
        else sp.delete("view");
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

    function clearAll() {
        setGender("");
        setVerifiedOnly(false);
        setSort("relevance");
        setView("grid");
        setPriceMin("");
        setPriceMax("");
        setAgeMin("");
        setAgeMax("");
        setHasOwnPlace(false);
        setHomeVisit(false);
    }

    // Conta filtros ativos pra mostrar badge no botão.
    const activeCount = [
        gender !== "",
        verifiedOnly,
        sort !== "relevance",
        view !== "grid",
        priceMin !== "",
        priceMax !== "",
        ageMin !== "",
        ageMax !== "",
        hasOwnPlace,
        homeVisit,
    ].filter(Boolean).length;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2",
                    "text-sm font-semibold text-ink",
                    "border border-line bg-white",
                    "transition-all duration-150 ease-[var(--ease-tahoe)]",
                    "hover:bg-line/40 hover:border-ink/15",
                    "active:scale-[0.97]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
            >
                <SlidersHorizontal className="h-3.5 w-3.5 text-rose" strokeWidth={2} />
                Filtros
                {activeCount > 0 && (
                    <span
                        className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose px-1.5 text-2xs font-bold text-white tabular-nums"
                        aria-label={`${activeCount} filtros ativos`}
                    >
                        {activeCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Filtros"
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
                            // Mobile: bottom-sheet (pb-28 reserva BottomNav).
                            "rounded-t-3xl rounded-b-none px-5 pt-6 pb-28",
                            "max-h-[85vh] overflow-y-auto",
                            // Desktop: side drawer da direita — limita altura ao
                            // viewport útil (subtrai header sticky h-16 = 64px),
                            // alinha topo abaixo do header pra não cortar título.
                            "md:my-4 md:mr-4 md:max-w-md",
                            "md:rounded-3xl md:px-6 md:pt-6 md:pb-6",
                            "md:max-h-[calc(100vh-2rem)]",
                            "animate-fade-in",
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold tracking-tight text-ink">
                                Filtros
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

                        {/* Procuro */}
                        <div>
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                Procuro
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {GENDER_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value || "garotas"}
                                        type="button"
                                        onClick={() => setGender(opt.value)}
                                        className={cn(
                                            "flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
                                            gender === opt.value
                                                ? "border-rose bg-rose-soft text-rose"
                                                : "border-line bg-white text-ink-dim hover:border-ink/15 hover:text-ink",
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Verificação */}
                        <div>
                            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 transition-colors hover:border-ink/15">
                                <input
                                    type="checkbox"
                                    checked={verifiedOnly}
                                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <span className="text-md text-ink">Apenas verificadas</span>
                            </label>
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
                                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 transition-colors hover:border-ink/15">
                                    <input
                                        type="checkbox"
                                        checked={hasOwnPlace}
                                        onChange={(e) => setHasOwnPlace(e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-md text-ink">Local próprio</span>
                                </label>
                                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 transition-colors hover:border-ink/15">
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

                        {/* Ordenar */}
                        <div>
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                Ordenar por
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setSort(opt.value)}
                                        className={cn(
                                            "flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
                                            sort === opt.value
                                                ? "border-rose bg-rose-soft text-rose"
                                                : "border-line bg-white text-ink-dim hover:border-ink/15 hover:text-ink",
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visualização */}
                        <div>
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                Visualização
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setView("grid")}
                                    className={cn(
                                        "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
                                        view === "grid"
                                            ? "border-rose bg-rose-soft text-rose"
                                            : "border-line bg-white text-ink-dim hover:border-ink/15 hover:text-ink",
                                    )}
                                >
                                    <Grid3X3 className="h-4 w-4" strokeWidth={2} />
                                    Grade
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView("list")}
                                    className={cn(
                                        "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40",
                                        view === "list"
                                            ? "border-rose bg-rose-soft text-rose"
                                            : "border-line bg-white text-ink-dim hover:border-ink/15 hover:text-ink",
                                    )}
                                >
                                    <List className="h-4 w-4" strokeWidth={2} />
                                    Lista
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto flex gap-3 pt-4">
                            <Button
                                variant="secondary"
                                onClick={clearAll}
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

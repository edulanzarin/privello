"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
 * FilterDrawer — Design System v2.5 (Tahoe Sensual, denso).
 *
 * Caminho: src/components/discover/filter-drawer.tsx
 * Steering: `.kiro/steering/design-system.md` §13.3 + §6 (Switch).
 *
 * Drawer flutuante (mobile e desktop) com TODOS os filtros. v2.5:
 *  - Paddings reduzidos (py-5, gap-4) — mais denso, menos espaço morto.
 *  - Toggles macOS (Switch primitive) substituem checkboxes em
 *    "Apenas verificadas" / "Local próprio" / "A domicílio".
 *  - SegmentedSelect helper (botões pill com selecionado em rose-soft) pra
 *    Procuro, Ordenar e Visualização.
 *
 * Mobile + desktop: drawer flutuante com pt-20 (header), pb-24 (BottomNav
 * mobile) ou pb-4 (desktop), px-4 lateral.
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
                    className="fixed inset-0 z-50 flex items-stretch justify-center px-4 pt-20 pb-24 md:items-stretch md:justify-end md:px-0 md:pt-20 md:pr-4 md:pb-4"
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
                            "relative flex w-full flex-col gap-4 glass-panel",
                            "rounded-3xl px-5 py-5 overflow-y-auto",
                            "md:max-w-md md:px-6",
                            "animate-fade-in",
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold tracking-tight text-ink">
                                Filtros
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Fechar"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-dim hover:bg-line/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                            >
                                <X className="h-4 w-4" strokeWidth={2} />
                            </button>
                        </div>

                        {/* Procuro — segmented */}
                        <Section label="Procuro">
                            <div className="grid grid-cols-3 gap-1.5">
                                {GENDER_OPTIONS.map((opt) => (
                                    <SegmentedButton
                                        key={opt.value || "garotas"}
                                        active={gender === opt.value}
                                        onClick={() => setGender(opt.value)}
                                    >
                                        {opt.label}
                                    </SegmentedButton>
                                ))}
                            </div>
                        </Section>

                        {/* Verificadas — switch */}
                        <SwitchRow
                            label="Apenas verificadas"
                            checked={verifiedOnly}
                            onChange={setVerifiedOnly}
                        />

                        {/* Preço */}
                        <Section label="Preço por hora">
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
                        </Section>

                        {/* Idade */}
                        <Section label="Idade">
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
                        </Section>

                        {/* Atendimento — switches */}
                        <Section label="Atendimento">
                            <SwitchRow
                                label="Local próprio"
                                checked={hasOwnPlace}
                                onChange={setHasOwnPlace}
                                inline
                            />
                            <SwitchRow
                                label="A domicílio"
                                checked={homeVisit}
                                onChange={setHomeVisit}
                                inline
                            />
                        </Section>

                        {/* Ordenar — segmented 2x2 */}
                        <Section label="Ordenar por">
                            <div className="grid grid-cols-2 gap-1.5">
                                {SORT_OPTIONS.map((opt) => (
                                    <SegmentedButton
                                        key={opt.value}
                                        active={sort === opt.value}
                                        onClick={() => setSort(opt.value)}
                                    >
                                        {opt.label}
                                    </SegmentedButton>
                                ))}
                            </div>
                        </Section>

                        {/* Visualização */}
                        <Section label="Visualização">
                            <div className="grid grid-cols-2 gap-1.5">
                                <SegmentedButton
                                    active={view === "grid"}
                                    onClick={() => setView("grid")}
                                    icon={<Grid3X3 className="h-3.5 w-3.5" strokeWidth={2} />}
                                >
                                    Grade
                                </SegmentedButton>
                                <SegmentedButton
                                    active={view === "list"}
                                    onClick={() => setView("list")}
                                    icon={<List className="h-3.5 w-3.5" strokeWidth={2} />}
                                >
                                    Lista
                                </SegmentedButton>
                            </div>
                        </Section>

                        <div className="mt-auto flex gap-2 pt-3">
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

/* ──────────────────────────────────────────────────────────────────────────
   Helpers internos do drawer (não exportados — uso só aqui).
   ────────────────────────────────────────────────────────────────────────── */

function Section({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                {label}
            </p>
            <div className="flex flex-col gap-2">{children}</div>
        </div>
    );
}

function SegmentedButton({
    active,
    onClick,
    icon,
    children,
}: {
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                    ? "border-rose bg-rose-soft text-rose"
                    : "border-line bg-white text-ink-dim hover:border-ink/15 hover:text-ink",
            )}
        >
            {icon}
            {children}
        </button>
    );
}

function SwitchRow({
    label,
    checked,
    onChange,
    inline = false,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    /** inline=true: usa dentro de Section (sem padding extra); false: linha standalone com padding maior. */
    inline?: boolean;
}) {
    return (
        <label
            className={cn(
                "flex cursor-pointer items-center justify-between gap-3",
                inline
                    ? "min-h-[40px]"
                    : "min-h-[44px] rounded-xl border border-line bg-white px-4 transition-colors hover:border-ink/15",
            )}
        >
            <span className="text-md text-ink">{label}</span>
            <Switch checked={checked} onChange={onChange} size="md" label={label} />
        </label>
    );
}

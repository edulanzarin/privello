import Link from "next/link";
import { cn } from "@/lib/utils";

export type TopCityPill = {
    href: string;
    label: string;
};

/**
 * TopCitiesPills — fileira de pílulas com links pras top cidades.
 *
 * Caminho: src/components/marketing/top-cities-pills.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6.
 *
 * Pílulas brancas com border-line, hover rose-soft. Fonte única de verdade
 * para o estilo dessas pílulas — usado abaixo de qualquer SearchBar.
 *
 * Consumidores:
 *  - src/app/page.tsx (Home)
 *  - src/app/descobrir/page.tsx (Hub sem cidade)
 *
 * Props:
 *  - `pills`: lista de `{ href, label }` (geralmente vinda de `getTopCities`).
 *  - `align?`: `"left" | "center"` (default `"left"` — segue o alinhamento
 *    do hero das páginas atuais que consomem). Use `"center"` apenas em
 *    layouts hero-centered.
 *  - `className?`: classes extras no wrapper.
 */
export function TopCitiesPills({
    pills,
    align = "left",
    className,
}: {
    pills: TopCityPill[];
    align?: "left" | "center";
    className?: string;
}) {
    if (pills.length === 0) return null;
    return (
        <div
            className={cn(
                "flex flex-wrap gap-2",
                align === "center" ? "justify-center" : "justify-start",
                className,
            )}
        >
            {pills.map((p) => (
                <Link
                    key={p.href}
                    href={p.href}
                    className="inline-flex items-center rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-rose-soft hover:text-rose hover:border-rose/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    {p.label}
                </Link>
            ))}
        </div>
    );
}

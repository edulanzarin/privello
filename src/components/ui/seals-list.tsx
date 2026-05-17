import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

/**
 * SealsList — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/seals-list.tsx
 * Steering: `.kiro/steering/design-system.md` §6, §3 (tokens).
 *
 * Lista vertical de selos/atributos com hairlines, ícone + label + sub.
 * Substitui o markup inline `<ul divide-y divide-line border border-line bg-white>`
 * que aparecia em /p/[slug]. Reaproveitável em qualquer página que precise
 * exibir uma lista de "fatos verificáveis" sobre uma entidade — perfil,
 * cidade, plano, painel.
 *
 * Visual:
 *  - Card branco rounded-xl com border-line + shadow-hairline.
 *  - Cada linha: ícone à esquerda (4×4), label semibold + sub-text inline.
 *  - Divisores hairline `divide-line` entre linhas.
 *  - Padding `px-3.5 py-2.5` por linha.
 *
 * Props:
 *  - `seals`: array de `{ Icon, label, sub?, color? }`.
 *  - `className?`: extras no wrapper externo.
 *
 * Tipo de cada selo:
 *  - `Icon`: lucide-react icon (4×4, strokeWidth 2).
 *  - `label`: texto principal (text-sm font-semibold ink).
 *  - `sub?`: texto secundário inline depois do label (text-xs ink-dim).
 *  - `color?`: classe Tailwind para colorir o ícone (default `text-ink-dim`).
 *     Use `text-rose`, `text-info`, `text-success`, etc. dos tokens v2.
 */

export type Seal = {
    Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    sub?: string;
    color?: string;
};

export function SealsList({
    seals,
    className,
}: {
    seals: Seal[];
    className?: string;
}) {
    if (seals.length === 0) return null;
    return (
        <ul
            className={cn(
                "divide-y divide-line rounded-xl border border-line bg-white shadow-[var(--shadow-hairline)]",
                className,
            )}
        >
            {seals.map((s) => (
                <li
                    key={s.label}
                    className="flex items-center gap-3 px-3.5 py-2.5"
                >
                    <s.Icon
                        className={cn("h-4 w-4 shrink-0", s.color ?? "text-ink-dim")}
                        strokeWidth={2}
                    />
                    <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-ink">
                            {s.label}
                        </span>
                        {s.sub && (
                            <span className="ml-1.5 text-xs text-ink-dim">
                                {s.sub}
                            </span>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

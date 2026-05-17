import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ListingHeader — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/listing-header.tsx
 * Steering: `.kiro/steering/design-system.md` §4 (typography), §5.1 (containers).
 *
 * Cabeçalho padrão das páginas de listagem cross-city (`/em-alta`,
 * `/em-destaque`, `/novidades`, etc.). Estrutura:
 *  - **Eyebrow** (uppercase tracking-wider rose/peach/etc.) — opcional, marca o
 *    contexto/categoria.
 *  - **Title** — Inter Bold 4xl/5xl com tracking apertado (Tahoe scale).
 *    Aceita inline highlights via children/JSX (ex.: `<span>contador</span>`).
 *  - **Subtitle** — text-md ink-dim alinhado embaixo do título à direita
 *    em desktop, embaixo no mobile.
 *
 * Reusa o ambient gradient (sem `bg-white` matador). Container externo
 * é responsabilidade do consumidor — passe `<ListingHeader>` dentro de
 * `<div className="mx-auto max-w-7xl ...">` (steering §5.1: listing
 * archetype usa `max-w-7xl`).
 *
 * Props:
 *  - `eyebrow?`: texto pré-título uppercase. Cor controlada por `eyebrowVariant`.
 *  - `eyebrowVariant?`: `"rose"` (default) | `"peach"` | `"plum"` | `"info"` | `"muted"`.
 *  - `title`: ReactNode (texto + highlights inline).
 *  - `subtitle?`: ReactNode (caption à direita do título em desktop).
 *  - `className?`: classes extras no wrapper externo.
 */

type EyebrowVariant = "rose" | "peach" | "plum" | "info" | "muted";

const eyebrowStyles: Record<EyebrowVariant, string> = {
    rose: "text-rose",
    peach: "text-peach",
    plum: "text-plum",
    info: "text-info",
    muted: "text-ink-dim",
};

export function ListingHeader({
    eyebrow,
    eyebrowVariant = "rose",
    title,
    subtitle,
    className,
}: {
    eyebrow?: string;
    eyebrowVariant?: EyebrowVariant;
    title: ReactNode;
    subtitle?: ReactNode;
    className?: string;
}) {
    return (
        <header className={cn("py-10 sm:py-12", className)}>
            {eyebrow && (
                <p
                    className={cn(
                        "text-2xs font-semibold uppercase tracking-wider",
                        eyebrowStyles[eyebrowVariant],
                    )}
                >
                    {eyebrow}
                </p>
            )}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <h1 className="font-bold leading-[1.1] tracking-[-0.025em] text-ink text-4xl sm:text-5xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm leading-relaxed text-ink-dim sm:text-base sm:max-w-md sm:text-right">
                        {subtitle}
                    </p>
                )}
            </div>
        </header>
    );
}

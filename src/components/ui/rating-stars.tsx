import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RatingStars — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/rating-stars.tsx
 * Steering: `.kiro/steering/design-system.md` §4 (typography), §3 (tokens).
 *
 * Renderização padronizada de avaliação 1–5 estrelas. Substitui o markup
 * inline `★★★☆☆` (text-cream / text-line) que aparece em /p/[slug],
 * /avaliar/[slug] e admin.
 *
 * Visual:
 *  - Estrelas preenchidas em `text-cream fill-cream`.
 *  - Estrelas vazias em `text-line`.
 *  - Tamanhos: `xs` (3.5×3.5), `sm` (4×4), `md` (5×5).
 *
 * Props:
 *  - `value`: 0–5 (números fracionários truncam pra inteiro mais próximo).
 *  - `max?`: total de estrelas (default 5).
 *  - `size?`: `"xs" | "sm" | "md"` (default `"sm"`).
 *  - `aria-label?`: texto pra leitor de tela (ex.: "5 de 5 estrelas").
 *    Default deriva de `value`/`max`.
 *  - `className?`: classes extras no wrapper.
 */

type RatingSize = "xs" | "sm" | "md";

const SIZE_CLASS: Record<RatingSize, string> = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
};

export function RatingStars({
    value,
    max = 5,
    size = "sm",
    "aria-label": ariaLabel,
    className,
}: {
    value: number;
    max?: number;
    size?: RatingSize;
    "aria-label"?: string;
    className?: string;
}) {
    const filled = Math.round(Math.max(0, Math.min(value, max)));
    const stars = Array.from({ length: max });
    return (
        <span
            role="img"
            aria-label={ariaLabel ?? `${filled} de ${max} estrelas`}
            className={cn("inline-flex items-center gap-0.5", className)}
        >
            {stars.map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        SIZE_CLASS[size],
                        i < filled
                            ? "fill-cream text-cream"
                            : "text-line",
                    )}
                    strokeWidth={i < filled ? 0 : 2}
                    aria-hidden
                />
            ))}
        </span>
    );
}

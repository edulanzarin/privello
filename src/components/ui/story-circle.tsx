"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

/**
 * StoryCircle — primitivo do círculo de story (estilo Instagram + Tahoe Sensual).
 *
 * Caminho: src/components/ui/story-circle.tsx
 * Steering: `.kiro/steering/design-system.md` §6.1, §15.
 *
 * Visual v2 (Tahoe Sensual):
 *  - Active (não visto): ring com gradiente diagonal `rose → peach → plum`
 *    (135deg) — substitui o `from-coral via-coral to-warning` da v1.
 *  - Seen: ring sólido em `--line` (hairline) + opacity 90 na foto.
 *  - Hover desktop: scale 1.04, easing `var(--ease-tahoe)`, 200ms.
 *  - Active press: scale 0.98 (feedback tátil).
 *
 * Sizes (cobre todos os usos do produto):
 *  - `sm`  → 48px  — headers compactos, drawers, popovers.
 *  - `md`  → 62px  — default StoryBar (Descobrir). **NÃO ALTERAR** —
 *                    o seletor e2e em `tests/e2e/lib/instrumentation.ts`
 *                    depende de `h-[62px] w-[62px]` no DOM.
 *  - `lg`  → 96px  — listagens densas, cards de destaque.
 *  - `xl`  → 160 / 192px responsivo — capa do perfil público.
 *
 * Props:
 *  - `imageUrl`: URL da foto de capa.
 *  - `displayName`: nome (alt da imagem + label).
 *  - `seen?`: marca como já visualizado (default false).
 *  - `size?`: `"sm" | "md" | "lg" | "xl"` (default `"md"`).
 *  - `withLabel?`: renderiza label (primeiro nome) abaixo (default true).
 *  - `onClick?`: handler — sem ele o componente é estático (sem botão).
 *  - `disabled?`: desabilita interação.
 *  - `className?`: classes extras no wrapper externo.
 *
 * Reutilização atual:
 *  - StoryBar (Descobrir) → size `md` + label.
 *  - ProfileStoryCover (perfil) → size `xl` sem label, com pílula
 *    contadora separada do consumidor.
 *  - Futuro: em-alta, novidades, dashboards de provider.
 */

type StoryCircleSize = "sm" | "md" | "lg" | "xl";

const RING_CLASSES: Record<StoryCircleSize, string> = {
    sm: "h-12 w-12 p-[2px]",
    md: "h-[62px] w-[62px] p-[3px]",
    lg: "h-24 w-24 p-[3px]",
    xl: "h-40 w-40 sm:h-48 sm:w-48 p-[4px]",
};

const IMAGE_SIZES: Record<StoryCircleSize, string> = {
    sm: "48px",
    md: "62px",
    lg: "96px",
    xl: "(min-width: 640px) 192px, 160px",
};

const LABEL_MAX_WIDTH: Record<StoryCircleSize, string> = {
    sm: "max-w-[48px]",
    md: "max-w-[62px]",
    lg: "max-w-[96px]",
    xl: "max-w-[192px]",
};

const RING_GRADIENT =
    "bg-[linear-gradient(135deg,var(--rose)_0%,var(--peach)_50%,var(--plum)_100%)]";

type ButtonProps = ComponentPropsWithoutRef<"button">;

export type StoryCircleProps = {
    imageUrl: string;
    displayName: string;
    seen?: boolean;
    size?: StoryCircleSize;
    withLabel?: boolean;
    className?: string;
} & Omit<ButtonProps, "className">;

export function StoryCircle({
    imageUrl,
    displayName,
    seen = false,
    size = "md",
    withLabel = true,
    className,
    onClick,
    disabled,
    type = "button",
    ...rest
}: StoryCircleProps) {
    const isInteractive = !disabled && !!onClick;
    const ring = RING_CLASSES[size];
    const sizes = IMAGE_SIZES[size];
    const labelMax = LABEL_MAX_WIDTH[size];

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group flex shrink-0 flex-col items-center gap-1.5",
                "transition-transform duration-200 ease-[var(--ease-tahoe)]",
                isInteractive && "hover:scale-[1.04] active:scale-[0.98]",
                disabled && "opacity-60 cursor-default",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "rounded-full",
                className,
            )}
            {...rest}
        >
            <span
                className={cn(
                    "relative block overflow-hidden rounded-full",
                    ring,
                    seen ? "bg-line" : RING_GRADIENT,
                )}
            >
                <span className="relative block h-full w-full overflow-hidden rounded-full border-2 border-white">
                    <Image
                        src={imageUrl}
                        alt={displayName}
                        fill
                        sizes={sizes}
                        className={cn("object-cover", seen && "opacity-90")}
                    />
                </span>
            </span>
            {withLabel && (
                <span
                    className={cn(
                        "truncate text-2xs font-medium text-ink-dim",
                        labelMax,
                    )}
                >
                    {displayName.split(" ")[0]}
                </span>
            )}
        </button>
    );
}

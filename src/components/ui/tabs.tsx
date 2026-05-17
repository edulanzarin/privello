"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

/**
 * Primitivo `Tabs` do design system (macOS Sonoma-inspired).
 *
 * Caminho: src/components/ui/tabs.tsx
 *
 * Substitui implementações ad-hoc de tabs/sub-nav espalhadas em
 * `/admin/moderacao`, `/painel/midias` e `media-gallery`. Suporta dois modos
 * de operação:
 *
 * 1. **Navegação por URL** — quando `item.href` está setado e `onChange` é
 *    omitido, cada tab é renderizado como `<Link>` do Next.js. O tab ativo
 *    recebe `aria-current="page"`.
 * 2. **Controlado por estado** — quando `onChange` é provido, cada tab é um
 *    `<button>` que dispara `onChange(key)` no clique ou via teclado
 *    (Enter/Space).
 *
 * Acessibilidade (WAI-ARIA Tabs Pattern, com adaptação para nav por URL):
 * - Container com `role="tablist"`.
 * - Cada tab com `role="tab"` e `aria-selected` (true/false).
 * - Roving tabindex: o tab ativo recebe `tabIndex=0`, os demais `-1`.
 * - Setas ←/→ e Home/End movem foco entre tabs (manual activation).
 * - No modo controlado, Enter/Space ativa o tab focado via `onChange`.
 * - Touch target ≥ 44×44 (`min-h-[44px] min-w-[44px]`) — Req 12.2.
 * - Focus ring `ring-blue/40` consistente com outros primitivos.
 *
 * Variantes:
 * - `pills` (default): pílulas arredondadas. Ativo `bg-foreground text-white`,
 *   inativo `text-muted hover:bg-black/[0.04]`.
 * - `underline`: linha de 2px `bg-coral` abaixo do ativo, sem fundo.
 *
 * Cross-refs:
 * - .kiro/specs/redesign-macos-system/design.md — seção "Tabs (novo)".
 * - .kiro/specs/redesign-macos-system/requirements.md — Requirement 4.
 */

/**
 * Item individual exposto pelo componente. `href` ativa modo Link;
 * `badge` (opcional) renderiza um contador adjacente ao label.
 */
export type TabItem = {
    key: string;
    label: string;
    href?: string;
    badge?: number;
};

export type TabsProps = {
    items: TabItem[];
    activeKey: string;
    variant?: "pills" | "underline";
    size?: "sm" | "md";
    /**
     * Quando provido, cada tab vira `<button>` e o callback é disparado no
     * clique e via Enter/Space. Tem precedência sobre `item.href`.
     */
    onChange?: (key: string) => void;
    className?: string;
};

const sizeStyles: Record<NonNullable<TabsProps["size"]>, string> = {
    sm: "px-3 text-sm",
    md: "px-4 text-base",
};

export function Tabs({
    items,
    activeKey,
    variant = "pills",
    size = "md",
    onChange,
    className,
}: TabsProps) {
    // Ref array para roving tabindex — focar tab vizinho com setas/Home/End.
    const tabRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

    function focusTabAt(index: number) {
        const len = items.length;
        if (len === 0) return;
        const safe = ((index % len) + len) % len; // wrap-around
        tabRefs.current[safe]?.focus();
    }

    function handleKeyDown(event: KeyboardEvent, index: number, key: string) {
        switch (event.key) {
            case "ArrowRight":
                event.preventDefault();
                focusTabAt(index + 1);
                break;
            case "ArrowLeft":
                event.preventDefault();
                focusTabAt(index - 1);
                break;
            case "Home":
                event.preventDefault();
                focusTabAt(0);
                break;
            case "End":
                event.preventDefault();
                focusTabAt(items.length - 1);
                break;
            case "Enter":
            case " ":
                if (onChange) {
                    event.preventDefault();
                    onChange(key);
                }
                break;
        }
    }

    return (
        <div
            role="tablist"
            className={cn(
                "flex flex-wrap",
                variant === "pills" && "gap-1",
                variant === "underline" && "gap-0 border-b border-black/[0.06]",
                className,
            )}
        >
            {items.map((item, index) => {
                const isActive = item.key === activeKey;
                const useLink = !!item.href && !onChange;

                const baseClasses = cn(
                    "relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 font-medium transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    sizeStyles[size],
                    // Variante pills
                    variant === "pills" && "rounded-lg",
                    variant === "pills" && isActive && "bg-foreground text-white",
                    variant === "pills" &&
                    !isActive &&
                    "text-muted hover:bg-black/[0.04] hover:text-foreground",
                    // Variante underline (linha 2px coral sob o ativo)
                    variant === "underline" && "border-b-2",
                    variant === "underline" && isActive && "border-coral text-foreground",
                    variant === "underline" &&
                    !isActive &&
                    "border-transparent text-muted hover:text-foreground",
                );

                const content = (
                    <>
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                            <span
                                className={cn(
                                    "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums",
                                    isActive && variant === "pills"
                                        ? "bg-white/20 text-white"
                                        : "bg-black/[0.06] text-muted",
                                )}
                            >
                                {item.badge}
                            </span>
                        )}
                    </>
                );

                if (useLink && item.href) {
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            ref={(el) => {
                                tabRefs.current[index] = el;
                            }}
                            role="tab"
                            aria-selected={isActive}
                            aria-current={isActive ? "page" : undefined}
                            tabIndex={isActive ? 0 : -1}
                            onKeyDown={(e) => handleKeyDown(e, index, item.key)}
                            className={baseClasses}
                        >
                            {content}
                        </Link>
                    );
                }

                return (
                    <button
                        key={item.key}
                        type="button"
                        ref={(el) => {
                            tabRefs.current[index] = el;
                        }}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange?.(item.key)}
                        onKeyDown={(e) => handleKeyDown(e, index, item.key)}
                        className={baseClasses}
                    >
                        {content}
                    </button>
                );
            })}
        </div>
    );
}

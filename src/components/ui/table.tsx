/**
 * Primitivo de tabela densa do design system
 *
 * Caminho: src/components/ui/table.tsx
 *
 * Encapsula `<table>` com a chrome canônica do design language: wrapper
 * `Card variant="solid" padding="none"`, scroll horizontal via
 * `overflow-x-auto`, hairline `border-b border-line` no `<thead>`, hover
 * sutil em linhas e padding consistente em células de cabeçalho/corpo.
 *
 * Substitui o pattern recorrente em `/admin/*` de reescrever
 * `<table className="w-full text-left text-sm">` com classes Tailwind
 * cruas (zinc/amber/sky/emerald). Páginas devem compor exclusivamente via
 * `Table` + `THead` + `TR` + `TH` + `TD`.
 *
 * Convenções:
 * - `min-width` é aplicado via `style` (não via classe arbitrária Tailwind),
 *   pois `min-w-[${prop}px]` em template literal não é detectado pelo
 *   compilador Tailwind v4.
 * - `<th>` sempre recebe `scope="col"` (semântica e a11y).
 * - `TR.hover` default `true` aplica `hover:bg-line/20 transition`.
 * - `TD.numeric` aplica simultaneamente `tabular-nums` e `text-right`.
 * - Server-component compatível (sem hooks, sem efeitos colaterais).
 *
 * Cross-refs:
 * - src/components/ui/card.tsx — wrapper externo (`variant="solid"`).
 * - .kiro/specs/redesign-macos-system/design.md — seção "Table (novo)".
 */

import { cn } from "@/lib/utils";
import type {
    HTMLAttributes,
    TdHTMLAttributes,
    ThHTMLAttributes,
} from "react";
import { Card } from "./card";

type Align = "left" | "right" | "center";

const alignStyles: Record<Align, string> = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
};

export interface TableProps {
    children: React.ReactNode;
    /** Largura mínima horizontal da `<table>` em pixels antes de scroll. Default 640. */
    minWidth?: number;
    className?: string;
}

/**
 * Container de tabela densa.
 *
 * Renderiza `Card variant="solid" padding="none"` → `<div overflow-x-auto>`
 * → `<table>`. Usa `style.minWidth` ao invés de classe arbitrária para que
 * o valor seja efetivamente aplicado em runtime.
 */
export function Table({ children, minWidth = 640, className }: TableProps) {
    return (
        <Card variant="solid" padding="none" className={cn("overflow-hidden", className)}>
            <div className="overflow-x-auto">
                <table
                    className="w-full border-collapse text-left text-sm"
                    style={{ minWidth: `${minWidth}px` }}
                >
                    {children}
                </table>
            </div>
        </Card>
    );
}

/**
 * Cabeçalho de tabela (`<thead>`) com hairline inferior canônico.
 */
export function THead({ children }: { children: React.ReactNode }) {
    return <thead className="border-b border-line">{children}</thead>;
}

export interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
    /** Aplica `hover:bg-line/20 transition` na linha. Default `true`. */
    hover?: boolean;
}

/**
 * Linha de tabela (`<tr>`) com border-bottom hairline e hover opcional.
 *
 * Última linha consecutiva remove a border via `last:border-0`.
 */
export function TR({ hover = true, className, children, ...props }: TRProps) {
    return (
        <tr
            className={cn(
                "border-b border-line last:border-0",
                hover && "hover:bg-line/20 transition",
                className,
            )}
            {...props}
        >
            {children}
        </tr>
    );
}

export interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
    align?: Align;
}

/**
 * Célula de cabeçalho (`<th scope="col">`) com tipografia canônica.
 *
 * `text-2xs font-semibold uppercase tracking-wider text-muted` + padding
 * `px-3 py-2.5`.
 */
export function TH({ align = "left", className, children, ...props }: THProps) {
    return (
        <th
            scope="col"
            className={cn(
                "px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted",
                alignStyles[align],
                className,
            )}
            {...props}
        >
            {children}
        </th>
    );
}

export interface TDProps extends TdHTMLAttributes<HTMLTableCellElement> {
    align?: Align;
    /** Aplica `tabular-nums text-right` para colunas numéricas. */
    numeric?: boolean;
}

/**
 * Célula de corpo (`<td>`) com padding `px-3 py-2`.
 *
 * Quando `numeric` é `true`, força `tabular-nums text-right` (sobrepõe
 * eventual `align`). Quando `numeric` é falsy, aplica `align` ou
 * `text-left` (default).
 */
export function TD({
    align = "left",
    numeric,
    className,
    children,
    ...props
}: TDProps) {
    return (
        <td
            className={cn(
                "px-3 py-2",
                numeric ? "tabular-nums text-right" : alignStyles[align],
                className,
            )}
            {...props}
        >
            {children}
        </td>
    );
}

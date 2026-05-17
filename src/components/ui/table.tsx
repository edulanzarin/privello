/**
 * Primitivo `Table` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/table.tsx
 * Steering: `.kiro/steering/design-system.md` §6.3.
 *
 * Encapsula `<table>` com chrome canônica: wrapper `Card variant="solid"`
 * (off-white opaco, hairline, sombra suave), scroll horizontal via
 * `overflow-x-auto`, hairline `border-b border-line` no `<thead>`, hover
 * sutil em linhas e padding consistente.
 *
 * Substitui o pattern recorrente em `/admin/*` de `<table className=...>`
 * com classes Tailwind cruas. Páginas devem compor exclusivamente via
 * `Table` + `THead` + `TR` + `TH` + `TD`.
 *
 * Convenções:
 *  - `min-width` aplicado via `style.minWidth` (Tailwind v4 não detecta
 *    template literal `min-w-[${prop}px]`).
 *  - `<th>` sempre `scope="col"` (a11y).
 *  - `TR.hover` default `true` aplica `hover:bg-line/30`.
 *  - `TD.numeric` aplica `tabular-nums text-right`.
 *  - Server-component compatível (sem hooks).
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

export function THead({ children }: { children: React.ReactNode }) {
    return <thead className="border-b border-line">{children}</thead>;
}

export interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
    /** Aplica `hover:bg-line/30` na linha. Default `true`. */
    hover?: boolean;
}

export function TR({ hover = true, className, children, ...props }: TRProps) {
    return (
        <tr
            className={cn(
                "border-b border-line last:border-0",
                hover && "transition-colors hover:bg-line/30",
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

export function TH({ align = "left", className, children, ...props }: THProps) {
    return (
        <th
            scope="col"
            className={cn(
                "px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-dim",
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
                "px-3 py-2 text-ink",
                numeric ? "tabular-nums text-right" : alignStyles[align],
                className,
            )}
            {...props}
        >
            {children}
        </td>
    );
}

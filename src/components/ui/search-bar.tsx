"use client";

import { type ReactNode, type FormEventHandler } from "react";
import { cn } from "@/lib/utils";

/**
 * SearchBar — primitivo da barra de busca pill (Tahoe Sensual v2.6).
 *
 * Caminho: src/components/ui/search-bar.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6 (search bar pattern), §6.
 *
 * Substitui o card sólido custom que vivia inline em `HeroSearchForm`. Agora
 * qualquer search bar do produto compõe os 3 building-blocks abaixo e ganha
 * o mesmo visual:
 *  - `<SearchBar>` — shell glass-panel rounded-2xl com layout responsivo.
 *    Mobile empilha vertical, desktop horizontal com dividers verticais
 *    automáticos entre fields.
 *  - `<SearchField>` — slot pra cada input/select com ícone à esquerda
 *    e label opcional acima.
 *  - `<SearchSubmit>` — botão rose CTA (variant primary do Button) que
 *    fecha a barra à direita em desktop / full-width em mobile.
 *
 * Uso em pares:
 *  - HeroSearchForm → 2 fields (Cidade + Procuro) + Submit "Descobrir"
 *  - DescobrirHub → reusa o mesmo HeroSearchForm + um segundo SearchBar de
 *    1 field (Nome ou @perfil) + Submit "Buscar".
 *
 * Convenção de tamanhos:
 *  - SearchBar: padding interno fixo (`p-2 md:p-1.5`).
 *  - SearchField: padding interno padrão (`px-3.5 py-2`); rounded-xl em
 *    mobile pra "respirar" como cards individuais empilhados.
 *  - SearchSubmit: rounded-xl com `min-w-[150px]` em desktop pra peso
 *    visual idêntico em qualquer tela.
 */

export function SearchBar({
    children,
    onSubmit,
    className,
}: {
    children: ReactNode;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    className?: string;
}) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn(
                "glass-panel rounded-2xl p-2",
                "flex flex-col gap-2",
                "md:flex-row md:items-stretch md:gap-0 md:p-1.5",
                "shadow-[var(--shadow-md)]",
                // Divider vertical automático entre filhos diretos (apenas desktop).
                "md:[&>*+*]:before:hidden", // resetar caso estilo herde
                className,
            )}
        >
            {children}
        </form>
    );
}

/**
 * SearchField — wraps icon + label + content (input/autocomplete/select).
 *
 * Props:
 * - `icon`: lucide-react icon (já recebe size/cor padronizados).
 * - `label?`: label discreto acima do conteúdo (text-xs ink-dim).
 * - `divider?`: quando true (default), renderiza divisor vertical à direita
 *   no desktop. O último field deve passar `divider={false}`.
 * - `className?`: classes extras (ex.: largura máxima para field "Procuro").
 * - `children`: o input/select/autocomplete em si, sem chrome próprio.
 */
export function SearchField({
    icon: Icon,
    label,
    divider = true,
    className,
    children,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
    label?: string;
    divider?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <>
            <label
                className={cn(
                    "flex flex-1 cursor-text items-center gap-2.5 rounded-xl px-3.5 py-2",
                    "md:rounded-lg md:hover:bg-line/30 transition-colors",
                    className,
                )}
            >
                <Icon
                    className="h-4 w-4 shrink-0 text-ink-dim"
                    strokeWidth={2}
                    aria-hidden
                />
                <span className="min-w-0 flex-1">
                    {label && (
                        <span className="block text-xs text-ink-dim">{label}</span>
                    )}
                    {children}
                </span>
            </label>
            {divider && (
                <div
                    className="hidden h-auto w-px self-stretch bg-line md:block"
                    aria-hidden
                />
            )}
        </>
    );
}

/**
 * SearchSubmit — botão rose CTA da SearchBar.
 *
 * Mesmo estilo do Button variant primary, com ajustes para encaixar como
 * elemento adjacente: `min-w-[150px]` em desktop pra peso visual estável
 * mesmo quando o label é curto ("Buscar") ou comprido ("Descobrir").
 */
export function SearchSubmit({
    children,
    className,
    disabled,
}: {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="submit"
            disabled={disabled}
            className={cn(
                "flex items-center justify-center gap-2 rounded-xl bg-rose px-6 py-3",
                "text-md font-semibold text-white",
                "shadow-[var(--shadow-sm)]",
                "transition-all duration-150 ease-[var(--ease-tahoe)]",
                "hover:brightness-105 active:scale-[0.98]",
                "disabled:opacity-40 disabled:hover:brightness-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "md:min-w-[150px]",
                className,
            )}
        >
            {children}
        </button>
    );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * AuthShell — layout centralizado para páginas de auth (Tahoe Sensual).
 *
 * Caminho: src/components/layout/auth-shell.tsx
 * Steering: `.kiro/steering/design-system.md` §5.1 (form archetype),
 * §13 (layout shells).
 *
 * Estrutura:
 *  - Tela inteira com flex centralizado (vertical + horizontal).
 *  - Logo `privello.` no topo (ponto rose).
 *  - Slot principal (`children`) — geralmente um `<Card variant="solid">`
 *    com o form.
 *  - Slot de footer opcional (`footer`) — links auxiliares (recuperar
 *    senha, voltar etc.).
 *  - Caption final "+18" sempre presente.
 *
 * Aplicado em:
 *  - /entrar
 *  - /recuperar-senha
 *  - /recuperar-senha/[token]
 *  - /cadastro/sucesso (variant compacta sem footer)
 *  - /assinar/sucesso
 *  - /cadastro (split de tipo de conta — usa `width="2xl"`)
 *
 * Não usado em /cadastro/cliente + /cadastro/acompanhante (split aside
 * escuro com branding) — esses são layouts marketing diferentes (ver
 * `<MarketingSplitShell>` se vir mais de 1 consumidor; até lá inline).
 *
 * Props:
 *  - `children`: conteúdo principal (geralmente Card com form).
 *  - `footer?`: linha de links/copy abaixo do card.
 *  - `caption?`: texto final (default "+18 · Conteúdo adulto"). Passe
 *    `null` para esconder.
 *  - `width?`: largura do conteúdo central — `"sm"` (default, 384px,
 *    para forms compactos) ou `"2xl"` (672px, para layouts com 2 cards
 *    lado a lado).
 *  - `className?`: classes extras no wrapper externo.
 */

const widthClasses = {
    sm: "max-w-sm",
    "2xl": "max-w-2xl",
} as const;

export function AuthShell({
    children,
    footer,
    caption = "Conteúdo adulto · +18",
    width = "sm",
    className,
}: {
    children: ReactNode;
    footer?: ReactNode;
    caption?: ReactNode | null;
    width?: keyof typeof widthClasses;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex min-h-screen flex-col items-center justify-center px-4 py-16",
                className,
            )}
        >
            <Link
                href="/"
                className="mb-8 text-3xl font-bold tracking-[-0.025em] text-ink"
            >
                privello<span className="text-rose">.</span>
            </Link>

            <div className={cn("w-full", widthClasses[width])}>{children}</div>

            {footer && (
                <div className="mt-6 text-center text-sm text-ink-dim">
                    {footer}
                </div>
            )}

            {caption !== null && (
                <p className="mt-8 text-xs text-ink-faint">{caption}</p>
            )}
        </div>
    );
}

import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * LegalShell + LegalSection — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/layout/legal-shell.tsx
 * Steering: `.kiro/steering/design-system.md` §5.1 (reading archetype),
 * §4 (Inter only — sem font-serif).
 *
 * Wrapper para páginas legais (`/termos-de-uso`, `/politica-de-privacidade`,
 * futura página de cookies). Container `max-w-3xl` (reading archetype) com
 * tipografia editorial em Inter Bold + tracking apertado.
 *
 * Estrutura:
 *  - SiteHeader + SiteFooter
 *  - Container max-w-3xl com padding consistente
 *  - Slot para título + meta (versão / vigência) + conteúdo
 *
 * Props:
 *  - `title`: título principal (renderizado em h1).
 *  - `version?`: número da versão (ex.: "1.0").
 *  - `validFrom?`: data de vigência ("17 de maio de 2026").
 *  - `children`: conteúdo das seções (use `<LegalSection>`).
 */
export function LegalShell({
    title,
    version,
    validFrom,
    children,
}: {
    title: string;
    version?: string;
    validFrom?: string;
    children: ReactNode;
}) {
    return (
        <>
            <SiteHeader />
            <main className="mx-auto max-w-3xl px-4 py-16 pb-32 sm:px-6">
                <h1 className="text-4xl font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl">
                    {title}
                </h1>
                {(version || validFrom) && (
                    <p className="mt-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                        {version && <>Versão {version}</>}
                        {version && validFrom && <span className="mx-1.5">·</span>}
                        {validFrom && <>vigência a partir de {validFrom}</>}
                    </p>
                )}

                <div className="mt-10 space-y-8 text-base leading-relaxed text-ink-dim">
                    {children}
                </div>
            </main>
            <SiteFooter />
        </>
    );
}

/**
 * LegalSection — seção numerada com estilo editorial Tahoe Sensual.
 *
 * Visual:
 *  - Heading h2 em Inter Bold tracking apertado.
 *  - Numeração à esquerda em ink-dim.
 *  - Espaçamento vertical generoso entre parágrafos.
 *
 * Props:
 *  - `n`: numeração (ex.: "1", "13").
 *  - `title`: título da seção.
 *  - `children`: conteúdo.
 */
export function LegalSection({
    n,
    title,
    children,
}: {
    n: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section>
            <h2 className="text-2xl font-bold tracking-[-0.022em] text-ink sm:text-3xl">
                <span className="mr-2 text-ink-dim tabular-nums">{n}.</span>
                {title}
            </h2>
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}

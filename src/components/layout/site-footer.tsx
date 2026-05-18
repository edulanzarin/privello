import Link from "next/link";

/**
 * Site footer — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/layout/site-footer.tsx
 * Steering: `.kiro/steering/design-system.md` §3 (tokens), §13.1 (BottomNav).
 *
 * Rodapé global do site público com logo + links rápidos (Planos, Descobrir,
 * Em alta, legal) + aviso "+18". Estático, sem props nem side effects.
 *
 * Visual:
 * - Border-top em hairline `border-line` (não `border-black/[0.06]`).
 * - Surface translúcida `bg-white/65 backdrop-blur-sm` para harmonizar com o
 *   ambient gradient ao rolar.
 * - Logo em Inter Bold tracking apertado, ponto rose final.
 * - Links em `text-ink-dim` com hover `text-ink`.
 * - Selo +18 em `text-ink-faint` (terciário).
 *
 * Cobertura mínima de footer (LGPD/UX): inclui links para
 * `/termos-de-uso` e `/politica-de-privacidade` por princípio (steering §15
 * cita política de privacidade como link obrigatório).
 *
 * Consumidores conhecidos:
 * - Todas as páginas públicas (home, descobrir, perfil, listings, legal,
 *   sucesso, error, etc.). Não usado em painel/admin/onboarding (esses têm
 *   shells próprios).
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white/65 pb-4 pt-8 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-lg font-bold tracking-[-0.022em] text-ink">
          privello<span className="text-rose">.</span>
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-ink-dim">
          <Link
            href="/planos"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            Planos
          </Link>
          <Link
            href="/descobrir"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            Descobrir
          </Link>
          <Link
            href="/em-alta"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            Em alta
          </Link>
          <Link
            href="/termos-de-uso"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            Termos
          </Link>
          <Link
            href="/politica-de-privacidade"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            Privacidade
          </Link>
          <span className="text-ink-faint">+18 · Conteúdo adulto</span>
        </div>
      </div>
    </footer>
  );
}

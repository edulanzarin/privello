import Link from "next/link";

/**
 * Rodapé do site público com logo + links rápidos (Planos, Descobrir, Em alta)
 * + aviso "+18". Estático, sem props nem side effects.
 *
 * Consumidores conhecidos:
 * - src/app/page.tsx
 * - src/app/p/[slug]/page.tsx
 * - src/app/descobrir/[citySlug]/page.tsx
 * - múltiplas outras páginas públicas (em-destaque, em-alta, planos, cidades, conta/perfil etc.)
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/[0.06] bg-white/60 pt-8 pb-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-lg font-bold tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-muted">
          <Link href="/planos" className="transition-colors hover:text-foreground">Planos</Link>
          <Link href="/descobrir/sao-paulo-sp" className="transition-colors hover:text-foreground">Descobrir</Link>
          <Link href="/em-alta" className="transition-colors hover:text-foreground">Em alta</Link>
          <span className="text-muted/50">+18 · Conteúdo adulto</span>
        </div>
      </div>
    </footer>
  );
}

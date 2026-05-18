import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Página 404 — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/not-found.tsx
 * Steering: `.kiro/steering/design-system.md` §4.3 (display Inter Bold),
 * §5.1 (reading archetype, container `max-w-3xl`), §6.3 (Button polimórfico).
 *
 * Renderizada quando o Next dispara `notFound()` ou um path não bate com
 * nenhuma rota. Layout editorial centralizado: número 404 grande em hairline
 * (`text-line`) como ornamento, headline + descrição em ink/ink-dim, dois CTAs
 * (descobrir + início) usando `<Button>` polimórfico (renderiza como `<Link>`).
 *
 * Rejeita explicitamente o padrão v1 (`font-serif`, `text-muted`,
 * `bg-foreground`) — Inter only, hierarquia por peso/tracking.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-7xl font-bold leading-none tracking-[-0.04em] text-line sm:text-8xl">
          404
        </p>
        <h1 className="mt-6 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
          Página não encontrada
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-ink-dim">
          Este link não existe ou o perfil foi removido.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/descobrir" variant="primary" size="lg">
            Buscar acompanhantes
          </Button>
          <Button href="/" variant="outline" size="lg">
            Início
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Página RSC — Confirmação de assinatura ativada (retorno do pagamento).
 *
 * Rota: `/assinar/sucesso`.
 * Tipo: Server Component.
 * Auth: público (renderiza confirmação estática).
 * Cache: default (RSC SSR; sem segredo dinâmico).
 *
 * Visual:
 * - Tahoe Sensual v2 — `<SiteHeader>` + `<SiteFooter>`, container reading
 *   `max-w-sm` centralizado, card `rounded-2xl border-line bg-white shadow-sm`
 *   com `<CheckCircle>` em `text-success` no topo.
 * - Tipografia Inter Bold tracking apertado (sem font-serif). Steering §4.3.
 * - CTAs: Button primary "Explorar conteúdo" + Button outline "Ver Reels".
 *
 * Cross-refs:
 * - src/components/ui/button.tsx (polimórfico)
 */
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Assinatura ativada · Privello",
  description: "Sua assinatura Privello foi ativada — explore o conteúdo exclusivo.",
};

export default function AssinaturaSuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="w-full rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-sm)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle className="h-7 w-7 text-success" strokeWidth={1.75} aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-[-0.022em] text-ink sm:text-3xl">
            Assinatura ativada
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-dim">
            Bem-vindo ao Privello. Você agora tem acesso a todo o conteúdo exclusivo da plataforma.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button href="/" variant="primary" size="lg" className="w-full">
              Explorar conteúdo
            </Button>
            <Button href="/reels" variant="outline" size="lg" className="w-full">
              Ver Reels exclusivos
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

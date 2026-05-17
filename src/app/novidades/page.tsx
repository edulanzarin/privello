/**
 * Página RSC — Novidades / blog (placeholder) — Design System v2.
 *
 * Rota: `/novidades`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 900` (Route Segment Config — janela de 15min).
 *
 * Página estática de placeholder. Container `max-w-3xl` (reading
 * archetype, steering §5.1).
 */
import { Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Card } from "@/components/ui/card";

// Cache strategy: revalidate=900 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 8.
export const revalidate = 900;

export default function NovidadesPage() {
  return (
    <>
      <SiteHeader activeHref="/novidades" />
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 pb-32 sm:px-6">
        <p className="text-2xs font-semibold uppercase tracking-wider text-rose">
          Editorial
        </p>
        <h1 className="mt-3 font-bold leading-[1.1] tracking-[-0.025em] text-ink text-4xl sm:text-5xl">
          Novidades
        </h1>
        <p className="mt-5 max-w-xl text-md leading-relaxed text-ink-dim sm:text-lg">
          Em breve: editoriais, guias de segurança e comunicados da equipe
          Privello.
        </p>

        <Card variant="glass" padding="lg" className="mt-10">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">
                Estamos preparando algo bom
              </h2>
              <p className="mt-2 text-base leading-relaxed text-ink-dim">
                Conteúdos sobre segurança, verificação, bem-estar e
                bastidores chegam aqui em breve. Conteúdo adulto (+18).
              </p>
            </div>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

// Cache strategy: revalidate=900 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 8.
// Página estática mas SiteHeader chama auth(); janela 15min aceitável; refactor static fica para fase-5.
export const revalidate = 900;

export default function NovidadesPage() {
  return (
    <>
      <SiteHeader activeHref="/novidades" />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-serif text-4xl">Novidades</h1>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Em breve: editoriais, guias de segurança e comunicados da equipe Privello. Conteúdo adulto (+18).
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

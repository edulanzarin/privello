/**
 * Página RSC — Lista de perfis com boost ativo — Design System v2.
 *
 * Rota: `/em-destaque`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 120` (Route Segment Config — janela de 2min).
 *
 * Mostra os perfis com `featuredUntil` no futuro, ordenados por plano e
 * views. Reusa `<ProfileCard>` em grid 3-col desktop / 2-col tablet /
 * 1-col mobile (steering §5.2, decisão B1).
 *
 * Cross-refs:
 *  - src/lib/services/profile.service.ts (getBoostedProfiles)
 */
import { Zap } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { getBoostedProfiles } from "@/lib/services";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingHeader } from "@/components/ui/listing-header";

// Cache strategy: revalidate=120 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 7.
export const revalidate = 120;

export default async function EmDestaqueePage() {
  const profiles = await getBoostedProfiles(100);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ListingHeader
            eyebrow="Boost ativo"
            eyebrowVariant="peach"
            title={
              <>
                Em destaque{" "}
                <span className="text-peach">
                  · <span className="tabular-nums">{profiles.length}</span>
                </span>
              </>
            }
            subtitle={
              <>
                Perfis com boost ativo no momento · ordenados por plano e
                visualizações
              </>
            }
          />

          {profiles.length === 0 ? (
            <EmptyState
              title="Nenhum boost ativo no momento"
              description="Boosts são ativados por anunciantes e duram 24h."
              icon={<Zap className="h-10 w-10" strokeWidth={1.5} />}
              action={{ label: "Voltar ao início", href: "/" }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 pb-12 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

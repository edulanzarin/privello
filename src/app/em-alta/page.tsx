/**
 * Página RSC — Ranking semanal de perfis em alta — Design System v2.
 *
 * Rota: `/em-alta`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 120` (Route Segment Config — janela de 2min).
 *
 * Lista os perfis com mais views na janela atual de ranking (resetada
 * semanalmente pelo cron `/api/cron/reset-hot`). Reusa `<ProfileCard>`
 * em grid 3-col desktop / 2-col tablet / 1-col mobile (steering §5.2,
 * decisão B1).
 *
 * Cross-refs:
 *  - src/lib/services/profile.service.ts (getHotProfiles, getHotPeriodStart)
 *  - src/app/api/cron/reset-hot/route.ts
 */
import { TrendingUp } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { getHotProfiles, getHotPeriodStart } from "@/lib/services";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingHeader } from "@/components/ui/listing-header";

// Cache strategy: revalidate=120 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 6.
export const revalidate = 120;

export default async function EmAltaPage() {
  const [profiles, periodStart] = await Promise.all([
    getHotProfiles(20),
    getHotPeriodStart(),
  ]);

  const since = periodStart
    ? periodStart.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    })
    : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ListingHeader
            eyebrow="Da semana"
            eyebrowVariant="rose"
            title={
              <>
                Em alta{" "}
                <span className="text-rose">
                  · <span className="tabular-nums">{profiles.length}</span>
                </span>
              </>
            }
            subtitle={
              since ? (
                <>
                  Período atual desde {since} · reseta toda segunda-feira
                </>
              ) : null
            }
          />

          {profiles.length === 0 ? (
            <EmptyState
              title="Ainda sem dados esta semana"
              description="Visite alguns perfis para começar a gerar o ranking."
              icon={<TrendingUp className="h-10 w-10" strokeWidth={1.5} />}
              action={{ label: "Explorar perfis", href: "/descobrir" }}
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

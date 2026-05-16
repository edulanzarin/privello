/**
 * Página RSC — Ranking semanal de perfis em alta (top 20 por views).
 *
 * Rota: `/em-alta`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 120` (Route Segment Config — janela de 2min).
 *
 * Lista os perfis com mais views na janela atual de ranking (resetada
 * semanalmente pelo cron `/api/cron/reset-hot`).
 *
 * Cross-refs:
 * - src/lib/services/profile.service.ts (getHotProfiles, getHotPeriodStart)
 * - src/app/api/cron/reset-hot/route.ts
 */
import { TrendingUp } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { getHotProfiles, getHotPeriodStart } from "@/lib/services";
import { EmptyState } from "@/components/ui/empty-state";

// Cache strategy: revalidate=120 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 6.
// Hot ranking semanal; estável em janela de 2min.
export const revalidate = 120;

export default async function EmAltaPage() {
  const [profiles, periodStart] = await Promise.all([
    getHotProfiles(20),
    getHotPeriodStart(),
  ]);

  const since = periodStart
    ? periodStart.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
    : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-16">
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-muted">
              Em alta da semana
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="font-serif text-3xl sm:text-4xl">
                Em alta{" "}
                <em className="font-serif text-2xl font-normal text-muted not-italic sm:text-3xl">
                  · {profiles.length} perfis
                </em>
              </h1>
              {since && (
                <p className="text-xs text-muted">
                  Período atual desde {since} · reseta toda segunda-feira
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {profiles.length === 0 ? (
            <EmptyState
              title="Ainda sem dados esta semana"
              description="Visite alguns perfis para começar a gerar o ranking."
              icon={<TrendingUp className="h-10 w-10" strokeWidth={1} />}
              action={{ label: "Explorar perfis", href: "/descobrir/sao-paulo-sp" }}
            />
          ) : (
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-4 [&>*]:mb-6 [&>*]:break-inside-avoid">
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

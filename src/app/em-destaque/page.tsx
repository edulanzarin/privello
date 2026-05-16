import Link from "next/link";
import { Zap } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { getBoostedProfiles } from "@/lib/services";

// Cache strategy: revalidate=120 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 7.
// Boosted ranking; estável em janela de 2min.
export const revalidate = 120;

export default async function EmDestaqueePage() {
  const profiles = await getBoostedProfiles(100);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pb-16">
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-muted">
              Boost ativo
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="font-serif text-3xl sm:text-4xl">
                Em destaque{" "}
                <em className="font-serif text-2xl font-normal text-muted not-italic sm:text-3xl">
                  · {profiles.length} perfis
                </em>
              </h1>
              <p className="text-xs text-muted">
                Perfis com boost ativo no momento · ordenados por plano e visualizações
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {profiles.length === 0 ? (
            <div className="py-20 text-center">
              <Zap className="mx-auto h-10 w-10 text-muted" strokeWidth={1} />
              <p className="mt-4 font-serif text-2xl">Nenhum boost ativo no momento.</p>
              <p className="mt-2 text-sm text-muted">
                Boosts são ativados por anunciantes e duram 24h.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block rounded-lg border border-foreground px-6 py-2.5 text-xs font-semibold"
              >
                Voltar ao início
              </Link>
            </div>
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

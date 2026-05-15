import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileCard } from "@/components/profile/profile-card";
import { getHotProfiles, getHotPeriodStart } from "@/lib/queries";

export const dynamic = "force-dynamic";

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
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
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
            <div className="py-20 text-center">
              <TrendingUp className="mx-auto h-10 w-10 text-muted" strokeWidth={1} />
              <p className="mt-4 font-serif text-2xl">Ainda sem dados esta semana.</p>
              <p className="mt-2 text-sm text-muted">
                Visite alguns perfis para começar a gerar o ranking.
              </p>
              <Link
                href="/descobrir/sao-paulo-sp"
                className="mt-6 inline-block rounded-lg border border-foreground px-6 py-2.5 text-xs font-semibold"
              >
                Explorar perfis
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

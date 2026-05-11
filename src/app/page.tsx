import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroSearchForm } from "@/components/marketing/hero-search-form";
import { ProfileCard } from "@/components/profile/profile-card";
import { FALLBACK_PLATFORM_STATS } from "@/lib/constants";
import { getPlatformStats, getHotProfiles, getBoostedProfiles } from "@/lib/queries";
import type { ProfileCardPayload } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Quick-access pills below the search form
const pills = [
  { href: "/descobrir/sao-paulo-sp", label: "São Paulo" },
  { href: "/descobrir/rio-de-janeiro-rj", label: "Rio de Janeiro" },
  { href: "/descobrir/curitiba-pr", label: "Curitiba" },
  { href: "/descobrir/balneario-camboriu-sc", label: "Balneário Camboriú" },
  { href: "/descobrir/florianopolis-sc", label: "Florianópolis" },
  { href: "/descobrir/porto=alegre-rs", label: "Porto Alegre" },
];

export default async function HomePage() {
  let stats = FALLBACK_PLATFORM_STATS;
  let hot: ProfileCardPayload[] = [];
  let boosted: ProfileCardPayload[] = [];

  try {
    const [s, h, b] = await Promise.all([getPlatformStats(), getHotProfiles(8), getBoostedProfiles(8)]);
    stats = s;
    hot = h as ProfileCardPayload[];
    boosted = b as ProfileCardPayload[];
  } catch {
    // use fallbacks
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <h1 className="font-serif text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Encontros sem pressa,{" "}
                <span className="text-coral">
                  com presença<span className="not-italic">.</span>
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                Curadoria editorial, verificação manual e perfis auditáveis. Você escolhe a cidade, o ritmo e com quem
                conversar — com transparência e respeito mútuo.
              </p>
            </div>
            <aside className="border-l-4 border-coral bg-white p-6 shadow-sm">
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between gap-4 border-b border-line pb-3">
                  <span className="text-muted">Perfis ativos</span>
                  <span className="font-semibold tabular-nums">{stats.profiles.toLocaleString("pt-BR")}</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-line pb-3">
                  <span className="text-muted">Verificados</span>
                  <span className="font-semibold tabular-nums">{stats.verifiedPct}%</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-line pb-3">
                  <span className="text-muted">Cidades</span>
                  <span className="font-semibold tabular-nums">{stats.cities}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-muted">Revisão de perfil</span>
                  <span className="font-semibold">24h</span>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Verificação por documento + selfie obrigatória. Conteúdo adulto (+18).
              </p>
            </aside>
          </div>

          <div className="mt-12">
            <Suspense fallback={<div className="h-24 animate-pulse bg-line" />}>
              <HeroSearchForm />
            </Suspense>
            <div className="mt-4 flex flex-wrap gap-2">
              {pills.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted transition hover:border-foreground/30 hover:text-foreground"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Em destaque (boost ativo) — só aparece quando há perfis boosted ── */}
        {boosted.length > 0 && (
          <section className="border-t border-line bg-white py-16">
            <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
              <h2 className="font-serif text-3xl font-light sm:text-4xl">
                Em destaque{" "}
                <em className="italic text-muted">· boost ativo</em>
              </h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
              {boosted.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Em alta da semana ── */}
        <section className="border-t border-line bg-white py-16">
          <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
            <h2 className="font-serif text-3xl font-light sm:text-4xl">
              Em alta <em className="italic text-muted">da semana</em>
            </h2>
            <Link href="/em-alta" className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Ver todas →
            </Link>
          </div>
          <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {hot.length ? (
              hot.map((p) => <ProfileCard key={p.id} profile={p} />)
            ) : (
              <p className="col-span-full text-center text-sm text-muted">
                Conecte o Postgres e rode <code className="text-foreground">npm run db:seed</code> para ver perfis de
                demonstração.
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <h2 className="font-serif text-3xl sm:text-4xl">
              Verificação <em className="text-coral not-italic">séria.</em> Sem rodeios.
            </h2>
            <ol className="space-y-8 text-sm">
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-coral">01</span>
                <div>
                  <p className="font-semibold">Cadastro do perfil</p>
                  <p className="mt-1 text-muted">Informações, valores e fotos públicas/privadas com diretrizes claras.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-coral">02</span>
                <div>
                  <p className="font-semibold">Documento + selfie</p>
                  <p className="mt-1 text-muted">Conferência humana e trilha de auditoria. Nada de atalhos.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-coral">03</span>
                <div>
                  <p className="font-semibold">Publicação</p>
                  <p className="mt-1 text-muted">Após aprovação, seu perfil entra na listagem com selo e ranking editorial.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

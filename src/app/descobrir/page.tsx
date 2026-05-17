/**
 * Página RSC — Hub de descoberta sem cidade — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/descobrir` (sem citySlug).
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 120`.
 *
 * Substitui a antiga `/buscar` (eliminada em 2026-05-17). Reusa o
 * `<HeroSearchForm>` da Home para garantir paridade visual e o mesmo
 * comportamento (cidade default `sao-paulo-sp` quando vazio + sessionStorage).
 *
 * Estrutura:
 *  1. Header + breadcrumb fino.
 *  2. Hero compacto com headline rose + sub.
 *  3. HeroSearchForm (mesmo da Home).
 *  4. Pílulas de top cidades (sem flechinha — mesmo estilo da Home).
 *  5. Divisor "ou" + Busca global por nome / @handle (form server-side `?q=`).
 *  6. Resultados em cards row brancos (quando `?q=`).
 *
 * Steering: `.kiro/steering/design-system.md` §5.1 (max-w-7xl listing),
 * §13.6 (hero pattern).
 *
 * Cross-refs:
 *  - src/components/marketing/hero-search-form.tsx
 *  - src/lib/services/profile.service.ts (searchProfilesGlobal)
 */
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { MapPin, BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSearchForm } from "@/components/marketing/hero-search-form";
import { searchProfilesGlobal } from "@/lib/services";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBrl } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const revalidate = 120;

async function getTopCities(limit = 5) {
    const cities = await prisma.city.findMany({
        where: { profiles: { some: {} } },
        select: { name: true, slug: true, _count: { select: { profiles: true } } },
        orderBy: { profiles: { _count: "desc" } },
        take: limit,
    });
    return cities.map((c) => ({
        href: `/descobrir/${c.slug}`,
        label: c.name,
    }));
}

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiscoverHubPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;
    const q = rawQ?.trim() ?? "";

    const [pills, results] = await Promise.all([
        getTopCities(5).catch(() => []),
        q.length >= 2 ? searchProfilesGlobal(q, 40) : Promise.resolve([]),
    ]);

    return (
        <>
            <SiteHeader />

            <main className="min-h-screen pb-32">
                {/* Breadcrumb */}
                <div className="border-b border-line">
                    <div className="mx-auto max-w-7xl px-4 py-3 text-xs font-medium text-ink-dim sm:px-6 lg:px-8">
                        <Link href="/" className="transition-colors hover:text-ink">
                            Home
                        </Link>
                        <span className="mx-1.5 text-ink-faint">/</span>
                        <span className="text-ink">Descobrir</span>
                    </div>
                </div>

                {/* ── Hero + Search ─────────────────────────────────────────── */}
                <section className="py-10 lg:py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h1 className="font-bold leading-[1.05] tracking-[-0.025em] text-ink text-5xl sm:text-6xl lg:text-7xl">
                            Descobrir{" "}
                            <span className="text-rose">acompanhantes.</span>
                        </h1>
                        <p className="mt-5 max-w-xl text-md leading-relaxed text-ink-dim sm:text-lg">
                            Escolha a cidade para ver perfis disponíveis ou busque por nome
                            ou @handle em qualquer lugar.
                        </p>

                        <div className="mt-8">
                            <Suspense
                                fallback={
                                    <div className="h-16 animate-pulse rounded-2xl bg-line/40" />
                                }
                            >
                                <HeroSearchForm />
                            </Suspense>
                            {pills.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {pills.map((p) => (
                                        <Link
                                            key={p.href}
                                            href={p.href}
                                            className="inline-flex items-center rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-ink transition-all duration-150 hover:bg-rose-soft hover:text-rose hover:border-rose/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        >
                                            {p.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Busca global por nome / @handle ──────────────────────── */}
                <section className="border-t border-line py-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
                                Buscar por nome
                            </h2>
                            <span className="text-sm text-ink-dim">ou @handle</span>
                        </div>

                        <form method="get" className="mt-6 flex max-w-2xl gap-2">
                            <input
                                type="search"
                                name="q"
                                defaultValue={q}
                                placeholder="Nome ou @handle em qualquer cidade…"
                                className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-md text-ink shadow-[var(--shadow-sm)] outline-none transition-all placeholder:text-ink-faint hover:border-ink/15 focus-visible:border-rose focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            />
                            <button
                                type="submit"
                                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose px-6 py-2.5 text-md font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                Buscar
                            </button>
                        </form>

                        {q && <SearchResults q={q} results={results} />}
                    </div>
                </section>
            </main>

            <SiteFooter />
        </>
    );
}

function SearchResults({
    q,
    results,
}: {
    q: string;
    results: Awaited<ReturnType<typeof searchProfilesGlobal>>;
}) {
    if (results.length === 0) {
        return (
            <div className="mt-8 max-w-2xl">
                <EmptyState
                    title={`Nenhum perfil encontrado para "${q}"`}
                    description="Tente um nome diferente ou busque por cidade."
                    action={{ label: "Voltar", href: "/descobrir" }}
                />
            </div>
        );
    }

    return (
        <div className="mt-8 max-w-2xl space-y-2">
            <p className="text-sm text-ink-dim">
                {results.length} perfil{results.length !== 1 ? "s" : ""} encontrado
                {results.length !== 1 ? "s" : ""} para{" "}
                <span className="font-semibold text-ink">&ldquo;{q}&rdquo;</span>
            </p>
            {results.map((p) => {
                const cover = p.media[0]?.url;
                return (
                    <Link
                        key={p.id}
                        href={`/p/${p.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-[var(--shadow-sm)] transition-all duration-200 ease-[var(--ease-tahoe)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-line">
                            {cover && (
                                <Image
                                    src={cover}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <p className="truncate text-md font-semibold text-ink">
                                    {p.displayName}
                                    <span className="ml-1 font-medium text-ink-dim">{p.age}</span>
                                </p>
                                {p.isVerified && (
                                    <BadgeCheck
                                        className="h-3.5 w-3.5 shrink-0 text-rose"
                                        strokeWidth={2.4}
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-ink-dim">
                                <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                                <span className="truncate">{p.city.name}</span>
                                <span className="text-line">·</span>
                                <span className="text-ink-faint">@{p.slug}</span>
                            </div>
                        </div>
                        {p.priceHour > 0 && (
                            <p className="shrink-0 text-base font-semibold tabular-nums text-rose">
                                {formatBrl(p.priceHour)}
                                <span className="ml-0.5 text-xs font-normal text-ink-dim">
                                    /h
                                </span>
                            </p>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}

/**
 * Página RSC — Hub de descoberta sem cidade — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/descobrir` (sem citySlug).
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 120`.
 *
 * Substitui a antiga `/buscar` (eliminada em 2026-05-17). Reusa os primitivos
 * `<HeroSearchForm>` e `<HandleSearchForm>` (ambos compostos sobre
 * `<SearchBar>`) — garante paridade visual com a Home e entre as duas barras
 * desta própria página.
 *
 * Estrutura:
 *  1. Header + breadcrumb fino.
 *  2. Hero centralizado com headline rose + sub.
 *  3. HeroSearchForm (cidade + procuro + CTA Descobrir).
 *  4. Pílulas de top cidades (mesmo estilo da Home).
 *  5. Divisor "ou".
 *  6. HandleSearchForm (busca por nome / @perfil).
 *  7. Resultados em cards row brancos (quando `?q=` está presente).
 *
 * Steering: `.kiro/steering/design-system.md` §5.1 (max-w-7xl listing),
 * §13.6 (hero pattern).
 */
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { MapPin, BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSearchForm } from "@/components/marketing/hero-search-form";
import { HandleSearchForm } from "@/components/marketing/handle-search-form";
import { searchProfilesGlobal } from "@/lib/services";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBrl } from "@/lib/money";

export const revalidate = 120;

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiscoverHubPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;
    const q = rawQ?.trim() ?? "";

    const results = q.length >= 2 ? await searchProfilesGlobal(q, 40) : [];

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

                {/* ── Hero alinhado à esquerda (mesmo padrão da Home) ─────── */}
                <section className="py-12 lg:py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl">
                            <h1 className="font-bold leading-[1.05] tracking-[-0.025em] text-ink text-5xl sm:text-6xl">
                                Descobrir{" "}
                                <span className="text-rose">acompanhantes.</span>
                            </h1>
                            <p className="mt-5 max-w-xl text-md leading-relaxed text-ink-dim sm:text-lg">
                                Escolha a cidade ou busque pelo nome do perfil em qualquer
                                lugar do Brasil.
                            </p>
                        </div>

                        {/* Search bars empilhadas, mesma largura, mesmo container da Home */}
                        <div className="mt-10 space-y-5">
                            <Suspense
                                fallback={
                                    <div className="h-16 animate-pulse rounded-2xl bg-line/40" />
                                }
                            >
                                <HeroSearchForm />
                            </Suspense>

                            {/* Divisor "ou" */}
                            <div className="flex items-center gap-3 py-2">
                                <div className="h-px flex-1 bg-line" />
                                <span className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                                    ou
                                </span>
                                <div className="h-px flex-1 bg-line" />
                            </div>

                            <HandleSearchForm defaultValue={q} />

                            {q && <SearchResults q={q} results={results} />}
                        </div>
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
            <div className="mt-2">
                <EmptyState
                    title={`Nenhum perfil encontrado para "${q}"`}
                    description="Tente um nome diferente ou busque por cidade."
                    action={{ label: "Voltar", href: "/descobrir" }}
                />
            </div>
        );
    }

    return (
        <div className="mt-2 space-y-2 text-left">
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

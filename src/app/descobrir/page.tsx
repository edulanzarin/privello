/**
 * Página RSC — Hub de descoberta sem cidade — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/descobrir` (sem citySlug).
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 120`.
 *
 * Substitui a antiga `/buscar` (eliminada em 2026-05-17). Concentra toda a
 * descoberta sem cidade em um único hub:
 *  1. Header + breadcrumb fino.
 *  2. Form de escolha de cidade (CityAutocomplete + Procuro + CTA Buscar).
 *  3. Busca global por nome / @handle (input estilo home).
 *     Se houver `?q=`, mostra resultados em cards (mesmo padrão de antes).
 *  4. Top cidades (pílulas glass).
 *
 * Steering: `.kiro/steering/design-system.md` §5.1 (container per archetype),
 * §13.6 (hero pattern).
 *
 * Cross-refs:
 *  - src/components/marketing/city-autocomplete.tsx
 *  - src/components/marketing/hero-search-form.tsx (referência visual)
 *  - src/lib/services/profile.service.ts (searchProfilesGlobal)
 */
import Link from "next/link";
import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { searchProfilesGlobal } from "@/lib/services";
import { EmptyState } from "@/components/ui/empty-state";
import { DiscoverHubForm } from "./discover-hub-form";
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
                    <div className="mx-auto max-w-4xl px-4 py-3 text-xs font-medium text-ink-dim sm:px-6">
                        <Link
                            href="/"
                            className="transition-colors hover:text-ink"
                        >
                            Home
                        </Link>
                        <span className="mx-1.5 text-ink-faint">/</span>
                        <span className="text-ink">Descobrir</span>
                    </div>
                </div>

                <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
                    {q ? (
                        <SearchResults
                            q={q}
                            results={results}
                        />
                    ) : (
                        <DiscoverHubLanding />
                    )}
                </div>
            </main>

            <SiteFooter />
        </>
    );
}

function DiscoverHubLanding() {
    return (
        <>
            <h1 className="text-4xl font-bold leading-none tracking-[-0.025em] text-ink sm:text-5xl">
                Descobrir
            </h1>
            <p className="mt-3 text-md text-ink-dim">
                Escolha a cidade para ver perfis disponíveis, ou busque por nome
                ou @handle em qualquer lugar.
            </p>

            <div className="mt-8">
                <DiscoverHubForm />
            </div>
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
    return (
        <>
            <div className="flex items-baseline justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-[-0.022em] text-ink">
                    Resultados para{" "}
                    <span className="text-rose">&ldquo;{q}&rdquo;</span>
                </h1>
                <Link
                    href="/descobrir"
                    className="shrink-0 text-sm font-semibold text-rose hover:underline"
                >
                    Limpar
                </Link>
            </div>

            <form method="get" className="mt-6 flex gap-2">
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Nome ou @handle…"
                    className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-md text-ink shadow-[var(--shadow-sm)] outline-none transition-all placeholder:text-ink-faint hover:border-ink/15 focus-visible:border-rose focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
                <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose px-5 py-2.5 text-base font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                    Buscar
                </button>
            </form>

            {results.length === 0 ? (
                <div className="mt-8">
                    <EmptyState
                        title={`Nenhum perfil encontrado para "${q}"`}
                        description="Tente um nome diferente ou busque por cidade."
                        action={{ label: "Voltar", href: "/descobrir" }}
                    />
                </div>
            ) : (
                <div className="mt-6 space-y-2">
                    <p className="text-sm text-ink-dim">
                        {results.length} perfil{results.length !== 1 ? "s" : ""}{" "}
                        encontrado{results.length !== 1 ? "s" : ""}
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
                                            <span className="ml-1 font-medium text-ink-dim">
                                                {p.age}
                                            </span>
                                        </p>
                                        {p.isVerified && (
                                            <BadgeCheck
                                                className="h-3.5 w-3.5 shrink-0 text-rose"
                                                strokeWidth={2.4}
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-ink-dim">
                                        <MapPin
                                            className="h-3 w-3 shrink-0"
                                            strokeWidth={2}
                                        />
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
            )}
        </>
    );
}

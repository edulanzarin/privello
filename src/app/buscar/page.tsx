import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BuscarForm } from "./buscar-form";
import { searchProfilesGlobal } from "@/lib/queries";
import { MapPin, BadgeCheck } from "lucide-react";

// Cache strategy: revalidate=120 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 4.
// Busca global por nome/handle; resultado público; janela de 2min aceitável.
export const revalidate = 120;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuscarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = rawQ?.trim() ?? "";

  const results = q.length >= 2 ? await searchProfilesGlobal(q, 40) : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        {q ? (
          <>
            {/* Global search results */}
            <div className="mb-6 flex items-baseline justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                Resultados para{" "}
                <span className="text-coral">&ldquo;{q}&rdquo;</span>
              </h1>
              <Link href="/buscar" className="text-sm text-blue hover:underline">
                Limpar
              </Link>
            </div>

            {/* Inline search to refine */}
            <form method="get" className="mb-6 flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Nome ou @handle…"
                className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-[7px] text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none transition-all hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
              />
              <button type="submit" className="rounded-lg bg-foreground px-4 py-[7px] text-base font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]">
                Buscar
              </button>
            </form>

            {results.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-md text-muted">Nenhum perfil encontrado para &ldquo;{q}&rdquo;.</p>
                <p className="mt-2 text-base text-muted">
                  Tente um nome diferente ou{" "}
                  <Link href="/buscar" className="text-blue hover:underline">busque por cidade</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted">{results.length} perfil{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}</p>
                {results.map((p) => {
                  const cover = p.media[0]?.url;
                  return (
                    <Link
                      key={p.id}
                      href={`/p/${p.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-black/[0.04]">
                        {cover && <Image src={cover} alt="" fill className="object-cover" sizes="48px" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-md font-semibold">{p.displayName}, {p.age}</p>
                          {p.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted">
                          <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{p.city.name}</span>
                          <span className="text-black/20">·</span>
                          <span className="text-muted/70">@{p.slug}</span>
                        </div>
                      </div>
                      {p.priceHour > 0 && (
                        <p className="shrink-0 text-base font-semibold text-coral">
                          R${p.priceHour}/h
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-4xl font-semibold tracking-tight">Buscar</h1>
            <p className="mt-2 text-md text-muted">
              Encontre por cidade, nome ou @handle.
            </p>

            {/* Global name/handle search */}
            <form method="get" className="mt-6 flex gap-2">
              <input
                name="q"
                placeholder="Nome ou @handle em qualquer cidade…"
                className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-[7px] text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-muted/60 hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
              />
              <button type="submit" className="rounded-lg bg-foreground px-4 py-[7px] text-base font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]">
                Buscar
              </button>
            </form>

            <div className="relative my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/[0.06]" />
              <span className="text-xs font-medium text-muted">ou busque por cidade</span>
              <div className="h-px flex-1 bg-black/[0.06]" />
            </div>

            <BuscarForm />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

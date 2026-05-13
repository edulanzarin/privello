import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BuscarForm } from "./buscar-form";
import { searchProfilesGlobal } from "@/lib/queries";
import { MapPin, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

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
              <h1 className="text-xl font-bold tracking-tight">
                Resultados para{" "}
                <span className="text-coral">&ldquo;{q}&rdquo;</span>
              </h1>
              <Link href="/buscar" className="text-xs text-muted underline underline-offset-2 hover:text-foreground">
                Limpar
              </Link>
            </div>

            {/* Inline search to refine */}
            <form method="get" className="mb-6 flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Nome ou @handle…"
                className="flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
              <button type="submit" className="bg-foreground px-4 py-2.5 text-xs font-bold uppercase text-white">
                Buscar
              </button>
            </form>

            {results.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted">Nenhum perfil encontrado para &ldquo;{q}&rdquo;.</p>
                <p className="mt-2 text-xs text-muted">
                  Tente um nome diferente ou{" "}
                  <Link href="/buscar" className="underline">busque por cidade</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted">{results.length} perfil{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}</p>
                {results.map((p) => {
                  const cover = p.media[0]?.url;
                  return (
                    <Link
                      key={p.id}
                      href={`/p/${p.slug}`}
                      className="flex items-center gap-3 border border-line bg-white p-3 hover:bg-line/40 transition"
                    >
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-line">
                        {cover && <Image src={cover} alt="" fill className="object-cover" sizes="44px" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold">{p.displayName}, {p.age}</p>
                          {p.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{p.city.name}</span>
                          <span>·</span>
                          <span className="text-muted/70">@{p.slug}</span>
                        </div>
                        {p.tagline && (
                          <p className="mt-0.5 truncate text-[11px] text-muted">&ldquo;{p.tagline}&rdquo;</p>
                        )}
                      </div>
                      {p.priceHour > 0 && (
                        <p className="shrink-0 text-xs font-semibold text-coral">
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
            <h1 className="text-2xl font-bold tracking-tight">Buscar</h1>
            <p className="mt-2 text-sm text-muted">
              Encontre por cidade, nome ou @handle.
            </p>

            {/* Global name/handle search */}
            <form method="get" className="mt-6 flex gap-2">
              <input
                name="q"
                placeholder="Nome ou @handle em qualquer cidade…"
                className="flex-1 border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-foreground"
              />
              <button type="submit" className="bg-foreground px-4 py-2.5 text-xs font-bold uppercase text-white">
                Buscar
              </button>
            </form>

            <div className="relative my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">ou busque por cidade</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <BuscarForm />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

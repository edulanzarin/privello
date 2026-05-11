import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Heart, MapPin, Star, LogOut, Search, SlidersHorizontal } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getClientFavorites } from "@/app/_actions/favorites";
import { formatBrl } from "@/lib/money";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ cidade?: string; ordem?: string }>;

export default async function ClientPerfilPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/conta/perfil");
  if (session.user.role === "PROVIDER") redirect("/painel");

  const { cidade, ordem } = await searchParams;

  const allFavorites = await getClientFavorites();
  const active = allFavorites.filter((f) => f.profile !== null);
  const inactive = allFavorites.length - active.length;

  // Filter by city
  let filtered = active;
  if (cidade) {
    filtered = active.filter((f) =>
      f.profile.city.name.toLowerCase().includes(cidade.toLowerCase())
    );
  }

  // Sort
  if (ordem === "preco_asc") {
    filtered = [...filtered].sort((a, b) => a.profile.priceHour - b.profile.priceHour);
  } else if (ordem === "preco_desc") {
    filtered = [...filtered].sort((a, b) => b.profile.priceHour - a.profile.priceHour);
  } else if (ordem === "recente") {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Unique cities from favorites
  const cities = [...new Set(active.map((f) => f.profile.city.name))].sort();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Minha conta</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {session.user.name ?? session.user.email}
            </h1>
            <p className="mt-0.5 text-sm text-muted">{session.user.email}</p>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button type="submit"
              className="flex items-center gap-1.5 border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:border-foreground hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sair
            </button>
          </form>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="border border-line bg-white p-4 text-center">
            <p className="text-2xl font-bold">{active.length}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Curtidos</p>
          </div>
          <div className="border border-line bg-white p-4 text-center">
            <p className="text-2xl font-bold">{cities.length}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Cidades</p>
          </div>
          <div className="border border-line bg-white p-4 text-center">
            <p className="text-2xl font-bold">{inactive}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Inativos</p>
          </div>
        </div>

        {/* ── Favorites section ── */}
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Curtidos · {filtered.length}
              {cidade && ` em ${cidade}`}
            </h2>
          </div>

          {active.length === 0 ? (
            <div className="border border-line bg-white px-6 py-14 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted" strokeWidth={1} />
              <p className="mt-4 text-lg font-semibold">Nenhum perfil curtido ainda.</p>
              <p className="mt-2 text-sm text-muted">
                Explore acompanhantes e curta os perfis que te interessam.
              </p>
              <Link href="/descobrir/sao-paulo-sp"
                className="mt-6 inline-block bg-coral px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white">
                Explorar perfis
              </Link>
            </div>
          ) : (
            <>
              {/* Filters */}
              <form method="get" className="mb-5 flex flex-wrap gap-3">
                <div className="flex flex-1 min-w-[180px] items-center gap-2 border border-line bg-white px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.5} />
                  <input
                    name="cidade"
                    defaultValue={cidade ?? ""}
                    placeholder="Filtrar por cidade…"
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted/60"
                  />
                </div>
                <div className="flex items-center gap-2 border border-line bg-white px-3 py-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.5} />
                  <select name="ordem" defaultValue={ordem ?? ""}
                    className="border-0 bg-transparent text-sm outline-none cursor-pointer">
                    <option value="">Mais recente</option>
                    <option value="preco_asc">Menor preço</option>
                    <option value="preco_desc">Maior preço</option>
                  </select>
                </div>
                <button type="submit"
                  className="bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                  Filtrar
                </button>
                {(cidade || ordem) && (
                  <Link href="/conta/perfil"
                    className="border border-line px-4 py-2 text-xs font-semibold text-muted hover:text-foreground">
                    Limpar
                  </Link>
                )}
              </form>

              {/* City quick filters */}
              {cities.length > 1 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Link key={c}
                      href={`/conta/perfil?cidade=${encodeURIComponent(c)}`}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        cidade === c
                          ? "border-foreground bg-foreground text-white"
                          : "border-line bg-white text-muted hover:border-foreground/30"
                      }`}>
                      {c}
                    </Link>
                  ))}
                </div>
              )}

              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Nenhum curtido em "{cidade}".{" "}
                  <Link href="/conta/perfil" className="text-coral underline">Ver todos</Link>
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map(({ profile, createdAt }) => {
                    const cover = profile.media[0];
                    const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
                    return (
                      <Link key={profile.id} href={`/p/${profile.slug}`}
                        className="group flex gap-4 border border-line bg-white p-4 transition hover:border-foreground/20 hover:shadow-sm">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-line">
                          <Image src={imageUrl} alt="" fill className="object-cover transition group-hover:scale-105" sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold leading-tight">
                              {profile.displayName}, {profile.age}
                            </p>
                            <p className="shrink-0 text-sm font-bold text-coral">
                              {formatBrl(profile.priceHour)}/h
                            </p>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                            {profile.district.name} · {profile.city.name}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <p className="flex items-center gap-1 text-xs text-muted">
                              <Star className="h-3 w-3 fill-coral text-coral" strokeWidth={0} />
                              {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} av.
                            </p>
                            <p className="text-[10px] text-muted">
                              {new Date(createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {inactive > 0 && (
            <p className="mt-4 text-xs text-muted">
              {inactive} perfil{inactive > 1 ? "s" : ""} curtido{inactive > 1 ? "s" : ""} não está{inactive > 1 ? "ão" : ""} mais disponível{inactive > 1 ? "is" : ""}.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

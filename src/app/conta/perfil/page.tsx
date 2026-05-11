import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Heart, MapPin, Star, LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getClientFavorites } from "@/app/_actions/favorites";
import { formatBrl } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ClientPerfilPage() {
  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/conta/perfil");

  // Redirect providers to their own panel
  if (session.user.role === "PROVIDER") redirect("/painel");

  const favorites = await getClientFavorites();
  const activeFavorites = favorites.filter((f) => f.profile !== null);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Minha conta</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {session.user.name ?? session.user.email}
            </h1>
            <p className="mt-1 text-sm text-muted">{session.user.email}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 border border-line px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted transition hover:border-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sair
            </button>
          </form>
        </div>

        {/* Favorites section */}
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Curtidos · {activeFavorites.length}
            </h2>
          </div>

          {activeFavorites.length === 0 ? (
            <div className="mt-6 border border-line bg-white px-6 py-12 text-center">
              <Heart className="mx-auto h-8 w-8 text-muted" strokeWidth={1} />
              <p className="mt-3 font-semibold">Nenhum perfil curtido ainda.</p>
              <p className="mt-1 text-sm text-muted">
                Explore acompanhantes e curta os perfis que te interessam.
              </p>
              <Link
                href="/descobrir/sao-paulo-sp"
                className="mt-6 inline-block bg-coral px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                Explorar perfis
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {activeFavorites.map(({ profile, createdAt }) => {
                const cover = profile.media[0];
                const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
                return (
                  <Link
                    key={profile.id}
                    href={`/p/${profile.slug}`}
                    className="group flex items-center gap-4 border border-line bg-white p-3 transition hover:border-foreground/20 hover:shadow-sm"
                  >
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-line">
                      <Image src={imageUrl} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">
                        {profile.displayName}, {profile.age}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                        {profile.district.name} · {profile.city.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                        <Star className="h-3 w-3 fill-coral text-coral" strokeWidth={0} />
                        {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} av.
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-coral">{formatBrl(profile.priceHour)} /h</p>
                      <p className="mt-1 text-[10px] text-muted">
                        Curtido em {new Date(createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {favorites.length > activeFavorites.length && (
            <p className="mt-4 text-xs text-muted">
              {favorites.length - activeFavorites.length} perfil(s) curtido(s) não está(ão) mais disponível(is).
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

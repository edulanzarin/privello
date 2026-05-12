import { redirect } from "next/navigation";
import { Heart, LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getClientFavorites } from "@/app/_actions/favorites";
import { FavoritesList } from "./favorites-list";

export const dynamic = "force-dynamic";

export default async function ClientPerfilPage() {
  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/conta/perfil");
  if (session.user.role === "PROVIDER") redirect("/painel");

  const [allFavorites, user] = await Promise.all([
    getClientFavorites(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { slug: true } }),
  ]);

  const active = allFavorites.filter((f) => f.profile !== null);
  const inactive = allFavorites.length - active.length;
  const cities = [...new Set(active.map((f) => f.profile.city.name))].sort();

  const handle = user?.slug ?? null;

  const favoritesForClient = active.map((f) => ({
    profile: {
      id: f.profile.id,
      slug: f.profile.slug,
      displayName: f.profile.displayName,
      age: f.profile.age,
      priceHour: f.profile.priceHour,
      ratingAvg: f.profile.ratingAvg,
      ratingCount: f.profile.ratingCount,
      district: { name: f.profile.district.name },
      city: { name: f.profile.city.name },
      media: f.profile.media.slice(0, 1).map((m) => ({ url: m.url })),
    },
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Minha conta</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {handle ? `@${handle}` : (session.user.name ?? session.user.email)}
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
              Curtidos · {active.length}
            </h2>
          </div>

          <FavoritesList favorites={favoritesForClient} />

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

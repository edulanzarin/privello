import { redirect } from "next/navigation";
import { Heart, LogOut, Crown, Lock, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getClientFavorites } from "@/app/_actions/favorites";
import { isSubscriber } from "@/lib/services";
import { FavoritesList } from "./favorites-list";
import { ClientAvatarUpload } from "./client-avatar-upload";
import { ClientProfileEdit } from "./client-profile-edit";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 21 (perfil do cliente logado).
export const dynamic = "force-dynamic";

export default async function ClientPerfilPage() {
  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/conta/perfil");
  if (session.user.role === "PROVIDER") redirect("/painel");

  const [allFavorites, user, subscribed] = await Promise.all([
    getClientFavorites(),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        slug: true,
        image: true,
        email: true,
        createdAt: true,
        subscriptions: {
          where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
          orderBy: { expiresAt: "desc" },
          take: 1,
          select: { expiresAt: true, createdAt: true },
        },
      },
    }),
    isSubscriber(session.user.id),
  ]);

  const active = allFavorites.filter((f) => f.profile !== null);
  const inactive = allFavorites.length - active.length;
  const cities = [...new Set(active.map((f) => f.profile.city.name))].sort();

  const handle = user?.slug ?? null;
  const activeSub = user?.subscriptions?.[0] ?? null;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  const favoritesForClient = active.map((f) => ({
    profile: {
      id: f.profile.id,
      slug: f.profile.slug,
      displayName: f.profile.displayName,
      age: f.profile.age,
      priceHour: f.profile.priceHour,
      ratingAvg: f.profile.ratingAvg,
      ratingCount: f.profile.ratingCount,
      district: f.profile.district ? { name: f.profile.district.name } : null,
      city: { name: f.profile.city.name },
      media: f.profile.media.slice(0, 1).map((m) => ({ url: m.url })),
    },
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        {/* ── Profile Header ── */}
        <Card variant="solid" padding="lg" className="relative overflow-hidden">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <ClientAvatarUpload currentImage={user?.image ?? null} userName={user?.name ?? null} />

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {user?.name ?? "Usuário"}
                </h1>
                {subscribed && <Badge variant="coral">Assinante</Badge>}
              </div>
              {handle && (
                <p className="mt-0.5 text-base text-muted">@{handle}</p>
              )}
              <p className="mt-0.5 text-base text-muted">{session.user.email}</p>
              {memberSince && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted sm:justify-start">
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  Membro desde {memberSince}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <ClientProfileEdit
                currentName={user?.name ?? ""}
                currentSlug={handle ?? ""}
              />
              <form action={async () => { "use server"; await signOut({ redirectTo: "/entrar" }); }}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-[7px] text-sm font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.97]"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Sair
                </button>
              </form>
            </div>
          </div>
        </Card>

        {/* ── Subscription status ── */}
        {subscribed && activeSub ? (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-success-dark">
              <Crown className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="text-base font-semibold">Assinante ativo</span>
            </div>
            <span className="text-sm text-muted">
              Renova em{" "}
              {new Date(activeSub.expiresAt).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-muted">
              <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="text-base">Sem assinatura — fotos privadas e avaliações bloqueadas</span>
            </div>
            <Link
              href="/assinar"
              className="shrink-0 rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
            >
              Assinar
            </Link>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Curtidos" value={active.length} icon={Heart} />
          <StatCard label="Cidades" value={cities.length} icon={Eye} />
          <StatCard label="Inativos" value={inactive} />
        </div>

        {/* ── Favorites section ── */}
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
            <h2 className="text-sm font-semibold">
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

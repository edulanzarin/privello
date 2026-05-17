/**
 * Página RSC — Perfil do cliente logado — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/conta/perfil`.
 * Tipo: Server Component.
 * Auth: cliente logado (não-logado redirecionado para `/entrar`; provider
 *  redirecionado para `/painel`).
 * Cache: `force-dynamic` (lê `auth()` + favoritos + assinatura).
 *
 * Steering: `.kiro/steering/design-system.md` §5.1 (max-w-4xl reading), §6.
 *
 * Estrutura:
 *  1. Header com avatar + dados + ações (Editar / Sair).
 *  2. Banner de assinatura (Card variant `success-subtle` quando ativo
 *     ou `solid` com CTA Assinar quando não).
 *  3. KPIs: Curtidos / Cidades / Inativos (StatCards 3-col).
 *  4. Seção "Curtidos" com lista de favoritos.
 *
 * Cross-refs:
 *  - src/app/_actions/favorites.ts (getClientFavorites)
 *  - src/lib/services/subscription.service.ts (isSubscriber)
 *  - src/app/conta/perfil/favorites-list.tsx
 *  - src/app/conta/perfil/client-avatar-upload.tsx
 *  - src/app/conta/perfil/client-profile-edit.tsx
 */
import { redirect } from "next/navigation";
import { Heart, LogOut, Crown, Lock, Eye, Calendar, MapPin } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })
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
        {/* ── Header card ──────────────────────────────────────────── */}
        <Card variant="solid" padding="lg">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ClientAvatarUpload
              currentImage={user?.image ?? null}
              userName={user?.name ?? null}
            />

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h1 className="text-3xl font-bold tracking-[-0.022em] text-ink">
                  {user?.name ?? "Usuário"}
                </h1>
                {subscribed && (
                  <Badge variant="rose" className="text-2xs">
                    <Crown className="h-3 w-3" strokeWidth={2.4} />
                    Assinante
                  </Badge>
                )}
              </div>
              {handle && (
                <p className="mt-0.5 text-base text-ink-dim">@{handle}</p>
              )}
              <p className="mt-0.5 text-base text-ink-dim">
                {session.user.email}
              </p>
              {memberSince && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-ink-dim sm:justify-start">
                  <Calendar className="h-3 w-3" strokeWidth={2} />
                  Membro desde {memberSince}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <ClientProfileEdit
                currentName={user?.name ?? ""}
                currentSlug={handle ?? ""}
              />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/entrar" });
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
                  Sair
                </Button>
              </form>
            </div>
          </div>
        </Card>

        {/* ── Subscription banner ─────────────────────────────────── */}
        {subscribed && activeSub ? (
          <Card
            variant="success-subtle"
            padding="md"
            className="mt-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-success">
              <Crown className="h-4 w-4 shrink-0" strokeWidth={2.4} />
              <span className="text-base font-semibold">Assinante ativo</span>
            </div>
            <span className="text-sm text-ink-dim">
              Renova em{" "}
              <span className="tabular-nums">
                {new Date(activeSub.expiresAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </span>
          </Card>
        ) : (
          <Card
            variant="solid"
            padding="md"
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2 text-ink-dim">
              <Lock className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="text-base">
                Sem assinatura — fotos privadas e avaliações bloqueadas
              </span>
            </div>
            <Button href="/assinar" variant="primary" size="sm" className="shrink-0">
              Assinar
            </Button>
          </Card>
        )}

        {/* ── Stats ────────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Curtidos" value={active.length} icon={Heart} />
          <StatCard label="Cidades" value={cities.length} icon={MapPin} />
          <StatCard label="Inativos" value={inactive} icon={Eye} />
        </div>

        {/* ── Favoritos ────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-2">
            <Heart className="h-4 w-4 fill-rose text-rose" strokeWidth={0} />
            <h2 className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
              Curtidos · <span className="tabular-nums text-ink">{active.length}</span>
            </h2>
          </div>

          <FavoritesList favorites={favoritesForClient} />

          {inactive > 0 && (
            <p className="mt-4 text-xs text-ink-dim">
              <span className="tabular-nums">{inactive}</span>{" "}
              perfil{inactive > 1 ? "s" : ""} curtido
              {inactive > 1 ? "s" : ""} não está
              {inactive > 1 ? "ão" : ""} mais disponível
              {inactive > 1 ? "is" : ""}.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Página RSC — Perfil público de acompanhante.
 *
 * Rota: `/p/[slug]`.
 * Tipo: Server Component.
 * Auth: público (lê `auth()` para personalizar UI: dono vê privadas,
 *  cliente assinante vê comentários, provider tem CTA de edição se for o
 *  dono e read-only no resto).
 * Cache: `force-dynamic` (visualizações, favorito e dados personalizados).
 *
 * Visual v2 (Tahoe Sensual):
 *  - Container `max-w-4xl` (reading archetype, steering §5.1).
 *  - Hero split: capa story XL à esquerda + info à direita.
 *  - Selos (Verificada / Vídeo / Membro / Views) numa lista hairline elegante.
 *  - CTAs primários: "Marcar horário" (rose) + "WhatsApp" (verde).
 *  - CTAs secundários: Curtir + Compartilhar.
 *  - Bio + Características + Valores + "Atende a" em 2 colunas no desktop.
 *  - Disponibilidade da semana ao lado (1.15fr / 0.85fr split).
 *  - Reviews em cards brancos `rounded-2xl` com border-line.
 *
 * Cross-refs:
 * - src/lib/services/profile.service.ts (getProfileBySlug, getUserReviewForProfile)
 * - src/lib/services/discover.service.ts (getStoriesForProfile)
 * - src/lib/services/subscription.service.ts (isSubscriber)
 * - src/app/_actions/favorites.ts (getFavoriteStatus)
 * - src/components/profile/* (gallery, view-tracker, favorite-button, etc.)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import {
  MapPin,
  Star,
  ShieldCheck,
  Video,
  Clock3,
  Lock,
  Eye,
  CalendarClock,
  Pencil,
  Sparkles,
  Crown,
  Flame,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProviderBanner } from "@/components/layout/provider-banner";
import { ViewTracker } from "@/components/profile/view-tracker";
import { FavoriteButton } from "@/components/profile/favorite-button";
import { MediaGallery } from "@/components/profile/media-gallery";
import { AudioPlayer } from "@/components/profile/audio-player";
import { ProfileStoryCover } from "@/components/profile/profile-story-cover";
import { auth } from "@/lib/auth";
import { getFavoriteStatus } from "@/app/_actions/favorites";
import { ShareButton } from "@/components/profile/share-button";
import { WhatsAppButton } from "@/components/profile/whatsapp-button";
import { formatBrl } from "@/lib/money";
import {
  getProfileBySlug,
  getUserReviewForProfile,
  getStoriesForProfile,
  isSubscriber,
} from "@/lib/services";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { DAYS_PT } from "@/lib/constants";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 2 (perfil personalizado por sessão).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.profile.findUnique({
    where: { slug },
    select: {
      displayName: true,
      age: true,
      tagline: true,
      city: { select: { name: true, slug: true } },
      media: { where: { isCover: true }, select: { url: true }, take: 1 },
    },
  });
  if (!profile) return {};

  const title = `${profile.displayName}, ${profile.age} anos — Acompanhante em ${profile.city.name}`;
  const description = profile.tagline
    ? `${profile.tagline} · Acompanhante em ${profile.city.name}. Perfil verificado no Privello.`
    : `Acompanhante em ${profile.city.name}. Veja fotos, áudio e vídeo no Privello.`;
  const coverUrl = profile.media[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · privello.`,
      description,
      ...(coverUrl ? { images: [{ url: coverUrl, width: 800, height: 1000 }] } : {}),
    },
  };
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  // Resolver ownership ANTES de buscar o perfil completo.
  let isProvider = false;
  let viewerProfileId: string | null = null;
  if (session?.user?.id) {
    try {
      const viewerProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true, slug: true },
      });
      if (viewerProfile) {
        isProvider = true;
        if (viewerProfile.slug === slug) viewerProfileId = viewerProfile.id;
      }
    } catch {
      isProvider = session.user.role === "PROVIDER";
    }
  }

  const profile = await getProfileBySlug(slug, {
    userId: session?.user?.id,
    includePrivate: viewerProfileId != null,
  });
  if (!profile) notFound();
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  if (profile.isSuspended && !isAdmin) notFound();

  const ownerView = viewerProfileId != null && viewerProfileId === profile.id;
  const canInteract = isLoggedIn && !ownerView && !isProvider;
  const initialFavorited = canInteract
    ? await getFavoriteStatus(profile.id)
    : false;

  const storyGroup = await getStoriesForProfile(profile.id, session?.user?.id);
  const isClientUser = isLoggedIn && !ownerView && !isProvider;
  const isSubscriberViewer = session?.user?.id
    ? await isSubscriber(session.user.id)
    : false;
  const userReview =
    isLoggedIn && !ownerView && session?.user?.id
      ? await getUserReviewForProfile(profile.id, session.user.id)
      : null;

  const allMedia = profile.media.map((m) => ({
    id: m.id,
    url: m.url,
    mediaType: m.mediaType,
    isPublic: m.isPublic,
    isCover: m.isCover,
    caption: m.caption,
    createdAt: m.createdAt.toISOString(),
    likeCount: m._count.likes,
    commentCount: m._count.comments,
    likedByMe: isClientUser
      ? (m.likes as { id: string }[]).length > 0
      : false,
  }));
  const cover =
    allMedia.find((m) => m.isCover && m.isPublic) ??
    allMedia.find((m) => m.isPublic) ??
    allMedia[0];

  const memberLabel = profile.memberSince.toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
  // Page é dinâmica; `Date.now()` aqui é avaliado uma vez por request.
  // eslint-disable-next-line react-hooks/purity -- intencional em RSC dinâmica
  const renderTimeMs = Date.now();
  const monthsVerified = Math.max(
    0,
    Math.floor((renderTimeMs - profile.memberSince.getTime()) / (30.44 * 86400000)),
  );

  const isBoosted =
    profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();

  // Plan badge — alinhado com ProfileCard
  const planBadge = (() => {
    if (isBoosted) {
      return { label: "Boost", Icon: Flame, bg: "bg-peach text-white" };
    }
    if (profile.planTier === "PREMIUM") {
      return { label: "Premium", Icon: Crown, bg: "bg-plum text-white" };
    }
    if (profile.planTier === "DESTAQUE") {
      return { label: "Plus", Icon: Sparkles, bg: "bg-cream text-ink" };
    }
    return null;
  })();

  // Selos (lista hairline)
  const seals: {
    Icon: typeof ShieldCheck;
    label: string;
    sub: string;
    color: string;
  }[] = [];
  if (profile.isVerified) {
    seals.push({
      Icon: ShieldCheck,
      label: "Identidade verificada",
      sub: "Documento + selfie",
      color: "text-rose",
    });
  }
  if (profile.videoVerified) {
    seals.push({
      Icon: Video,
      label: "Vídeo verificado",
      sub: "Gravação autenticada",
      color: "text-info",
    });
  }
  seals.push({
    Icon: Clock3,
    label: `Membro há ${monthsVerified} ${monthsVerified === 1 ? "mês" : "meses"}`,
    sub: `Desde ${memberLabel}`,
    color: "text-ink-dim",
  });
  seals.push({
    Icon: Eye,
    label: `${profile.viewsThisMonth.toLocaleString("pt-BR")} visualizações`,
    sub: "este mês",
    color: "text-ink-dim",
  });

  const services: [string, boolean][] = [
    ["Homens", profile.servesMen],
    ["Casais", profile.servesCouples],
    ["Mulheres", profile.servesWomen],
    ["Local próprio", profile.hasOwnPlace],
    ["Hotel / domicílio", profile.homeVisit],
    ["Viagens nacionais", profile.travelsNational],
    ["Viagens internacionais", profile.travelsInternational],
  ];

  const characteristics: [string, string][] = [
    [
      "Altura",
      profile.heightCm
        ? `${(profile.heightCm / 100).toFixed(2).replace(".", ",")} m`
        : "—",
    ],
    ["Manequim", profile.dressSize ?? "—"],
    ["Cabelo", profile.hair ?? "—"],
    ["Olhos", profile.eyes ?? "—"],
    ["Idiomas", profile.languages ?? "—"],
  ];

  return (
    <>
      <SiteHeader activeHref={`/descobrir/${profile.city.slug}`} />
      {!ownerView && <ViewTracker profileId={profile.id} />}
      {ownerView && <ProviderBanner variant="own-profile" />}

      <ViewTransition enter="slide-up" default="none">
        <main className="min-h-screen pb-28">
          {/* ── Breadcrumb ───────────────────────────────────────────── */}
          <div className="border-b border-line">
            <div className="mx-auto max-w-4xl px-4 py-3 text-xs font-medium text-ink-dim sm:px-6">
              <Link
                href="/descobrir"
                className="transition-colors hover:text-ink"
              >
                Descobrir
              </Link>
              <span className="mx-1.5 text-ink-faint">/</span>
              <Link
                href={`/descobrir/${profile.city.slug}`}
                className="transition-colors hover:text-ink"
              >
                {profile.city.name}
              </Link>
              <span className="mx-1.5 text-ink-faint">/</span>
              <span className="text-ink">{profile.displayName}</span>
            </div>
          </div>

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <section className="border-b border-line">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
                {/* Foto + plan badge */}
                <div className="relative shrink-0">
                  <ProfileStoryCover
                    storyGroup={storyGroup}
                    coverUrl={cover?.url ?? null}
                    displayName={profile.displayName}
                    isClient={isClientUser}
                  />
                  {planBadge && (
                    <span
                      className={cn(
                        "absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider",
                        "shadow-[var(--shadow-sm)]",
                        planBadge.bg,
                      )}
                    >
                      <planBadge.Icon
                        className="h-2.5 w-2.5"
                        strokeWidth={2.4}
                        aria-hidden
                      />
                      {planBadge.label}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                  {/* Status pills */}
                  <div className="mb-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {profile.isOnline && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-2xs font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        Online
                      </span>
                    )}
                    {profile.isVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-2.5 py-1 text-2xs font-semibold text-rose">
                        <ShieldCheck className="h-3 w-3" strokeWidth={2.4} />
                        Verificada
                      </span>
                    )}
                    {profile.videoVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-2xs font-semibold text-info">
                        <Video className="h-3 w-3" strokeWidth={2.4} />
                        Vídeo
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl font-bold leading-none tracking-[-0.025em] text-ink sm:text-5xl">
                    {profile.displayName}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-md text-ink-dim sm:justify-start">
                    <span className="font-medium text-ink">
                      {profile.age} anos
                    </span>
                    <span className="text-line">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                      {profile.city.name}
                    </span>
                    {profile.ratingCount > 0 && (
                      <>
                        <span className="text-line">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Star
                            className="h-3.5 w-3.5 fill-cream text-cream"
                            strokeWidth={0}
                          />
                          <span className="font-semibold tabular-nums text-ink">
                            {profile.ratingAvg.toFixed(1)}
                          </span>
                          <span>({profile.ratingCount})</span>
                        </span>
                      </>
                    )}
                  </div>

                  {profile.tagline && (
                    <p className="mt-3 max-w-md text-lg leading-snug text-ink-dim">
                      &ldquo;{profile.tagline}&rdquo;
                    </p>
                  )}

                  {profile.audioUrl && (
                    <div className="mt-5 w-full max-w-sm sm:max-w-none">
                      <AudioPlayer src={profile.audioUrl} />
                    </div>
                  )}

                  {/* Preço */}
                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="text-4xl font-bold tabular-nums text-rose tracking-[-0.02em]">
                      {formatBrl(profile.priceHour)}
                    </span>
                    <span className="text-md text-ink-dim">/ hora</span>
                    {profile.priceTwoHours && (
                      <span className="text-base text-ink-dim">
                        <span className="tabular-nums">
                          {formatBrl(profile.priceTwoHours)}
                        </span>
                        <span className="ml-0.5 text-xs">/ 2h</span>
                      </span>
                    )}
                  </div>

                  {/* Selos lista hairline */}
                  {seals.length > 0 && (
                    <ul className="mt-5 w-full max-w-sm divide-y divide-line rounded-xl border border-line bg-white sm:max-w-none">
                      {seals.map((s) => (
                        <li
                          key={s.label}
                          className="flex items-center gap-3 px-3.5 py-2.5"
                        >
                          <s.Icon
                            className={cn("h-4 w-4 shrink-0", s.color)}
                            strokeWidth={2}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-semibold text-ink">
                              {s.label}
                            </span>
                            <span className="ml-1.5 text-xs text-ink-dim">
                              {s.sub}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTAs */}
                  {!ownerView ? (
                    <>
                      <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:max-w-none">
                        <Link
                          href={`/solicitar/${profile.slug}`}
                          className={cn(
                            "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold text-white",
                            "bg-rose shadow-[var(--shadow-sm)]",
                            "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
                            "hover:brightness-105 active:brightness-95",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          )}
                        >
                          <CalendarClock className="h-4 w-4" strokeWidth={2} />
                          Marcar horário
                        </Link>
                        <WhatsAppButton
                          phone={profile.whatsappPhone}
                          profileId={profile.id}
                          className="w-full"
                        />
                      </div>
                      <div className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2 sm:max-w-none">
                        <FavoriteButton
                          profileId={profile.id}
                          initialFavorited={initialFavorited}
                          isLoggedIn={isLoggedIn}
                          className="w-full"
                        />
                        <ShareButton
                          displayName={profile.displayName}
                          slug={profile.slug}
                          className="w-full"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <Link
                        href="/painel/perfil"
                        className={cn(
                          "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-base font-medium text-ink",
                          "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
                          "hover:bg-line/30",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        )}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                        Editar perfil
                      </Link>
                      <ShareButton
                        displayName={profile.displayName}
                        slug={profile.slug}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Galeria ──────────────────────────────────────────────── */}
          <section className="border-b border-line">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <MediaGallery
                media={allMedia}
                displayName={profile.displayName}
                slug={profile.slug}
                isClient={isClientUser}
                isSubscriber={isSubscriberViewer}
                currentUserId={session?.user?.id}
                isOwner={ownerView}
                reelsCount={allMedia.filter((m) => m.mediaType === "REEL").length}
              />
            </div>
          </section>

          {/* ── Quem sou + Características + Disponibilidade ────────── */}
          <section className="border-b border-line py-14">
            <div className="mx-auto grid max-w-4xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.022em] text-ink">
                    Quem sou
                  </h2>
                  <div className="mt-4 space-y-3 text-md leading-relaxed text-ink-dim">
                    {profile.bio.split("\n").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                      Características
                    </h3>
                    <ul className="mt-3 divide-y divide-line border-b border-line">
                      {characteristics.map(([k, v]) => (
                        <li
                          key={k}
                          className="flex justify-between py-2.5 text-base"
                        >
                          <span className="text-ink-dim">{k}</span>
                          <span className="font-medium text-ink">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                      Valores
                    </h3>
                    <ul className="mt-3 divide-y divide-line border-b border-line">
                      <li className="flex justify-between py-2.5 text-base">
                        <span className="text-ink-dim">1 hora</span>
                        <span className="font-semibold tabular-nums text-rose">
                          {formatBrl(profile.priceHour)}
                        </span>
                      </li>
                      {profile.priceTwoHours ? (
                        <li className="flex justify-between py-2.5 text-base">
                          <span className="text-ink-dim">2 horas</span>
                          <span className="font-semibold tabular-nums text-ink">
                            {formatBrl(profile.priceTwoHours)}
                          </span>
                        </li>
                      ) : null}
                      {profile.priceOvernight ? (
                        <li className="flex justify-between py-2.5 text-base">
                          <span className="text-ink-dim">Pernoite</span>
                          <span className="font-semibold tabular-nums text-ink">
                            {formatBrl(profile.priceOvernight)}
                          </span>
                        </li>
                      ) : null}
                      {profile.priceTravelDay ? (
                        <li className="flex justify-between py-2.5 text-base">
                          <span className="text-ink-dim">Viagem (diária)</span>
                          <span className="font-semibold tabular-nums text-ink">
                            {formatBrl(profile.priceTravelDay)}
                          </span>
                        </li>
                      ) : null}
                      <li className="flex justify-between py-2.5 text-base">
                        <span className="text-ink-dim">Pagamento</span>
                        <span className="font-medium text-ink">
                          {profile.paymentMethods ?? "—"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Atende a
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {services.map(([label, on]) => (
                      <span
                        key={label}
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                          on
                            ? "bg-ink text-white"
                            : "bg-line/40 text-ink-faint line-through",
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold tracking-[-0.022em] text-ink">
                  Esta semana
                </h2>
                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {profile.availabilityRules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between py-2.5 text-base"
                    >
                      <span className="text-ink">
                        {DAYS_PT[r.weekday]} ·{" "}
                        <span className="tabular-nums text-ink-dim">
                          {r.startTime} – {r.endTime}
                        </span>
                      </span>
                      <span className="text-2xs font-semibold uppercase tracking-wider">
                        {r.status === "CLOSED" ? (
                          <span className="text-ink-dim">Fechado</span>
                        ) : r.status === "BUSY" ? (
                          <span className="text-warning">Ocupada</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            Disponível
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {!ownerView && (
                  <div className="mt-6 space-y-3">
                    <Link
                      href={`/solicitar/${profile.slug}`}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-md font-semibold text-white",
                        "bg-rose shadow-[var(--shadow-sm)]",
                        "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.98]",
                        "hover:brightness-105",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      )}
                    >
                      <CalendarClock className="h-4 w-4" strokeWidth={2} />
                      Montar horário · WhatsApp
                    </Link>
                    <p className="text-center text-sm leading-relaxed text-ink-dim">
                      Escolha dia, horário e duração. Abrimos o WhatsApp com
                      texto pronto, sem intermediários.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Reviews ──────────────────────────────────────────────── */}
          <section className="py-14">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-bold tracking-[-0.022em] text-ink">
                  {profile.ratingAvg > 0 ? (
                    <>
                      <span className="tabular-nums">
                        {profile.ratingAvg.toFixed(1)}
                      </span>
                      <span className="ml-2 text-xl font-medium text-ink-dim">
                        · {profile.ratingCount} avaliações
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl text-ink-dim">
                      Sem avaliações ainda
                    </span>
                  )}
                </h2>
                {isClientUser && !ownerView && (
                  isSubscriberViewer ? (
                    <Link
                      href={`/avaliar/${profile.slug}`}
                      className={cn(
                        "shrink-0 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-base font-semibold text-ink",
                        "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
                        "hover:bg-line/30",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      )}
                    >
                      {userReview ? "Editar avaliação" : "Avaliar"}
                    </Link>
                  ) : (
                    <Link
                      href={`/assinar?from=/p/${profile.slug}`}
                      className="shrink-0 text-2xs font-semibold uppercase tracking-wider text-rose hover:underline"
                    >
                      Assine para avaliar
                    </Link>
                  )
                )}
              </div>

              {profile.reviews.length === 0 ? (
                <p className="mt-8 text-sm text-ink-dim">
                  Nenhuma avaliação ainda.
                </p>
              ) : (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {profile.reviews.map((r) => (
                    <article
                      key={r.id}
                      className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                          {(r.user.name ?? "?")[0].toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-md font-semibold text-ink">
                            {r.user.slug ? `@${r.user.slug}` : r.user.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-dim">
                            <span className="text-cream">
                              {"★".repeat(r.rating)}
                              <span className="text-line">
                                {"★".repeat(5 - r.rating)}
                              </span>
                            </span>
                            <span className="tabular-nums">
                              {r.createdAt.toLocaleDateString("pt-BR")}
                            </span>
                          </p>
                        </div>
                      </div>
                      {isSubscriberViewer ? (
                        r.comment && (
                          <p className="mt-4 text-base italic leading-relaxed text-ink-dim">
                            {r.comment}
                          </p>
                        )
                      ) : (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-line/30 px-3 py-2">
                          <Lock
                            className="h-3 w-3 shrink-0 text-ink-dim"
                            strokeWidth={2}
                          />
                          <Link
                            href={`/assinar?from=/p/${profile.slug}`}
                            className="text-sm font-semibold text-rose hover:underline"
                          >
                            Assine para ver o comentário
                          </Link>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}

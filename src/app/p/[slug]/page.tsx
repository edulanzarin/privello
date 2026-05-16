import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { } from "react/canary";
import { MapPin, Star, ShieldCheck, Video, Clock3, Lock, Eye } from "lucide-react";
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
import { getProfileBySlug, getUserReviewForProfile, getStoriesForProfile, isSubscriber } from "@/lib/services";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { DAYS_PT } from "@/lib/constants";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 2 (perfil personalizado por sessão).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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

const PLAN_BADGE: Record<string, { bg: string; label: string }> = {
  PREMIUM: { bg: "bg-coral", label: "PREMIUM" },
  DESTAQUE: { bg: "bg-foreground", label: "PLUS" },
  ESSENCIAL: { bg: "bg-black/60", label: "BASIC" },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  // Resolver ownership ANTES de buscar o perfil completo, para que possamos
  // passar `includePrivate: ownerView` ao service (Wave 5 — Req 1). Donos
  // veem suas mídias privadas; demais usuários só veem públicas (com overlay
  // locked para não-assinantes em fase-5).
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
    // Quando o viewer é dono do perfil sendo exibido, mostramos privadas;
    // do contrário, AC 1.2 limita a ≤ 12 itens públicos por sortOrder.
    includePrivate: viewerProfileId != null,
  });
  if (!profile) notFound();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  if (profile.isSuspended && !isAdmin) notFound();

  const ownerView = viewerProfileId != null && viewerProfileId === profile.id;

  // Only non-provider users can interact — providers are read-only on all profiles
  const canInteract = isLoggedIn && !ownerView && !isProvider;
  const initialFavorited = canInteract ? await getFavoriteStatus(profile.id) : false;

  // Stories ativos deste perfil
  const storyGroup = await getStoriesForProfile(profile.id, session?.user?.id);
  const isClientUser = isLoggedIn && !ownerView && !isProvider;
  const isSubscriberViewer = session?.user?.id ? await isSubscriber(session.user.id) : false;
  const userReview = isLoggedIn && !ownerView && session?.user?.id
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
    likedByMe: isClientUser ? (m.likes as { id: string }[]).length > 0 : false,
  }));
  const cover = allMedia.find((m) => m.isCover && m.isPublic) ?? allMedia.find((m) => m.isPublic) ?? allMedia[0];

  const memberLabel = profile.memberSince.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  const monthsVerified = Math.max(0, Math.floor((Date.now() - profile.memberSince.getTime()) / (30.44 * 86400000)));

  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();
  const planBadge = isBoosted
    ? { bg: "bg-orange-500", label: "BOOST" }
    : (PLAN_BADGE[profile.planTier] ?? PLAN_BADGE.ESSENCIAL);

  // Verification seals
  const seals: { icon: typeof ShieldCheck; label: string; sub: string; color: string }[] = [];
  if (profile.isVerified) {
    seals.push({ icon: ShieldCheck, label: "Identidade verificada", sub: "Documento + selfie", color: "text-success" });
  }
  if (profile.videoVerified) {
    seals.push({ icon: Video, label: "Vídeo verificado", sub: "Gravação autenticada", color: "text-accent-purple" });
  }
  seals.push({ icon: Clock3, label: `Membro há ${monthsVerified} meses`, sub: `Desde ${memberLabel}`, color: "text-muted" });
  seals.push({ icon: Eye, label: `${profile.viewsThisMonth.toLocaleString("pt-BR")} visualizações`, sub: "este mês", color: "text-blue" });

  return (
    <>
      <SiteHeader activeHref={`/descobrir/${profile.city.slug}`} />
      {!ownerView && <ViewTracker profileId={profile.id} />}
      {ownerView && <ProviderBanner variant="own-profile" />}


      <ViewTransition enter="slide-up" default="none">
        <main className="min-h-screen pb-28">

          {/* ── Breadcrumb ── */}
          <div className="border-b border-black/[0.06]">
            <div className="mx-auto max-w-4xl px-4 py-3 text-xs font-medium text-muted sm:px-6">
              <Link href="/buscar" className="transition-colors hover:text-foreground">Descobrir</Link>
              {" / "}
              <Link href={`/descobrir/${profile.city.slug}`} className="transition-colors hover:text-foreground">{profile.city.name}</Link>
              {" / "}{profile.displayName}
            </div>
          </div>

          {/* ── Hero section ── */}
          <section className="bg-white border-b border-black/[0.06]">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">

                {/* ── Left: Round profile photo ── */}
                <div className="shrink-0">
                  <ProfileStoryCover
                    storyGroup={storyGroup}
                    coverUrl={cover?.url ?? null}
                    displayName={profile.displayName}
                    planBadge={planBadge}
                    isClient={isClientUser}
                  />
                </div>

                {/* ── Right: Info ── */}
                <div className="flex flex-1 flex-col items-center sm:items-start text-center sm:text-left">

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.isOnline && (
                      <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-[3px] text-xs font-semibold text-success-dark">
                        <span className="h-[6px] w-[6px] rounded-full bg-success animate-pulse" /> Online
                      </span>
                    )}
                    {profile.isVerified && (
                      <span className="flex items-center gap-1.5 rounded-full bg-blue/10 px-2.5 py-[3px] text-xs font-semibold text-blue">
                        <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Verificada
                      </span>
                    )}
                    {profile.videoVerified && (
                      <span className="flex items-center gap-1.5 rounded-full bg-accent-purple/10 px-2.5 py-[3px] text-xs font-semibold text-accent-purple">
                        <Video className="h-3 w-3" strokeWidth={2} /> Vídeo
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-4xl leading-none">
                    {profile.displayName}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-md text-muted">
                    <span className="font-medium text-foreground">{profile.age} anos</span>
                    <span className="text-black/20">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {profile.city.name}
                    </span>
                    {profile.ratingCount > 0 && (
                      <>
                        <span className="text-black/20">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" strokeWidth={0} />
                          <span className="font-medium text-foreground">{profile.ratingAvg.toFixed(1)}</span>
                          <span className="text-muted">({profile.ratingCount})</span>
                        </span>
                      </>
                    )}
                  </div>

                  {profile.tagline && (
                    <p className="mt-3 text-lg italic text-muted leading-snug max-w-md">
                      &ldquo;{profile.tagline}&rdquo;
                    </p>
                  )}

                  {/* Audio player */}
                  {profile.audioUrl && (
                    <div className="mt-4">
                      <AudioPlayer src={profile.audioUrl} />
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-5 inline-flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">{formatBrl(profile.priceHour)}</span>
                    <span className="text-muted text-md">/hora</span>
                    {profile.priceTwoHours && (
                      <span className="text-muted text-base ml-3">{formatBrl(profile.priceTwoHours)}<span className="text-xs">/2h</span></span>
                    )}
                  </div>

                  {/* Verification seals */}
                  {seals.length > 0 && (
                    <div className="mt-5 w-full max-w-sm sm:max-w-none divide-y divide-black/[0.05] rounded-xl border border-black/[0.07] bg-black/[0.02]">
                      {seals.map((s) => (
                        <div key={s.label} className="flex items-center gap-3 px-3.5 py-2.5">
                          <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} strokeWidth={1.5} />
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-foreground">{s.label}</span>
                            <span className="ml-1.5 text-xs text-muted">{s.sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTAs primários */}
                  {!ownerView ? (
                    <>
                      <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:max-w-none">
                        <Link
                          href={`/solicitar/${profile.slug}`}
                          className="flex items-center justify-center gap-2 rounded-full bg-coral py-3 text-base font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
                        >
                          Marcar horário
                        </Link>
                        <WhatsAppButton phone={profile.whatsappPhone} profileId={profile.id} className="w-full py-3" />
                      </div>
                      <div className="mt-2 grid w-full max-w-sm grid-cols-2 gap-2 sm:max-w-none">
                        <FavoriteButton profileId={profile.id} initialFavorited={initialFavorited} isLoggedIn={isLoggedIn} className="w-full py-2.5" />
                        <ShareButton displayName={profile.displayName} slug={profile.slug} className="w-full py-2.5" />
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 flex gap-2.5">
                      <Link href="/painel/perfil" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-base font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.97]">
                        Editar perfil
                      </Link>
                      <ShareButton displayName={profile.displayName} slug={profile.slug} />
                    </div>
                  )}

                </div>
              </div>
            </div>
          </section>

          {/* ── Media Gallery (tabs: Fotos | Vídeos | Reels) ── */}
          <section className="border-t border-black/[0.06]">
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

          {/* ── Bio + Characteristics + Availability ── */}
          <section className="border-t border-black/[0.06] bg-background py-14">
            <div className="mx-auto grid max-w-4xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">

              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Quem sou</h2>
                  <div className="mt-3 space-y-3 text-md leading-relaxed text-muted">
                    {profile.bio.split("\n").map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-medium text-muted">Características</h3>
                    <ul className="mt-3 space-y-0">
                      {[
                        ["Altura", profile.heightCm ? `${(profile.heightCm / 100).toFixed(2).replace(".", ",")} m` : "—"],
                        ["Manequim", profile.dressSize ?? "—"],
                        ["Cabelo", profile.hair ?? "—"],
                        ["Olhos", profile.eyes ?? "—"],
                        ["Idiomas", profile.languages ?? "—"],
                      ].map(([k, v]) => (
                        <li key={String(k)} className="flex justify-between border-b border-black/[0.05] py-2.5 text-base">
                          <span className="text-muted">{k}</span>
                          <span className="font-medium">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-muted">Valores</h3>
                    <ul className="mt-3 space-y-0">
                      <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-base">
                        <span className="text-muted">1 hora</span>
                        <span className="font-semibold">{formatBrl(profile.priceHour)}</span>
                      </li>
                      {profile.priceTwoHours ? (
                        <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-base">
                          <span className="text-muted">2 horas</span>
                          <span className="font-semibold">{formatBrl(profile.priceTwoHours)}</span>
                        </li>
                      ) : null}
                      {profile.priceOvernight ? (
                        <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-base">
                          <span className="text-muted">Pernoite</span>
                          <span className="font-semibold">{formatBrl(profile.priceOvernight)}</span>
                        </li>
                      ) : null}
                      {profile.priceTravelDay ? (
                        <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-base">
                          <span className="text-muted">Viagem (diária)</span>
                          <span className="font-semibold">{formatBrl(profile.priceTravelDay)}</span>
                        </li>
                      ) : null}
                      <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-base">
                        <span className="text-muted">Pagamento</span>
                        <span className="font-medium">{profile.paymentMethods ?? "—"}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-muted">Atende a</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ["Homens", profile.servesMen],
                      ["Casais", profile.servesCouples],
                      ["Mulheres", profile.servesWomen],
                      ["Local próprio", profile.hasOwnPlace],
                      ["Hotel / domicílio", profile.homeVisit],
                      ["Viagens nacionais", profile.travelsNational],
                      ["Viagens internacionais", profile.travelsInternational],
                    ].map(([label, on]) => (
                      <span
                        key={String(label)}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm font-medium",
                          on ? "bg-foreground text-white" : "bg-black/[0.04] text-muted line-through",
                        )}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Esta semana</h2>
                <ul className="mt-4 space-y-0">
                  {profile.availabilityRules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between border-b border-black/[0.05] py-2.5 text-base">
                      <span>{DAYS_PT[r.weekday]} · {r.startTime} – {r.endTime}</span>
                      <span className="text-xs font-medium uppercase">
                        {r.status === "CLOSED" ? (
                          <span className="text-muted">Fechado</span>
                        ) : r.status === "BUSY" ? (
                          <span className="text-coral">Ocupada</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-success-dark">
                            <span className="h-[5px] w-[5px] rounded-full bg-success" />Disponível
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {!ownerView && (
                  <>
                    <Link
                      href={`/solicitar/${profile.slug}`}
                      className="mt-6 flex w-full items-center justify-center rounded-full bg-coral py-3 text-md font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      Montar horário → WhatsApp
                    </Link>
                    <p className="mt-3 text-sm leading-relaxed text-muted text-center">
                      Escolha dia, horário e duração. Abrimos o WhatsApp com texto pronto — sem intermediários.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── Reviews ── */}
          <section className="border-t border-black/[0.06] py-14">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-semibold tracking-tight">
                  {profile.ratingAvg > 0 ? (
                    <>{profile.ratingAvg.toFixed(1)} <span className="text-xl text-muted font-normal">· {profile.ratingCount} avaliações</span></>
                  ) : (
                    <span className="text-2xl text-muted">Sem avaliações ainda</span>
                  )}
                </h2>
                {/* CTA for eligible clients */}
                {isClientUser && !ownerView && (
                  isSubscriberViewer ? (
                    <Link
                      href={`/avaliar/${profile.slug}`}
                      className="shrink-0 rounded-lg border border-foreground px-4 py-2 text-base font-semibold text-foreground transition hover:bg-foreground hover:text-white active:scale-[0.97]"
                    >
                      {userReview ? "Editar avaliação" : "Avaliar"}
                    </Link>
                  ) : (
                    <Link
                      href={`/assinar?from=/p/${profile.slug}`}
                      className="shrink-0 text-xs font-semibold text-coral hover:underline"
                    >
                      Assine para avaliar
                    </Link>
                  )
                )}
              </div>

              {profile.reviews.length === 0 ? (
                <p className="mt-8 text-sm text-muted">Nenhuma avaliação ainda.</p>
              ) : (
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                  {profile.reviews.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-white">
                          {(r.user.name ?? "?")[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="text-md font-semibold">
                            {r.user.slug ? `@${r.user.slug}` : r.user.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-base text-muted">
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                            <span className="ml-1">{r.createdAt.toLocaleDateString("pt-BR")}</span>
                          </p>
                        </div>
                      </div>
                      {isSubscriberViewer ? (
                        r.comment && (
                          <p className="mt-4 text-md italic leading-relaxed text-muted">{r.comment}</p>
                        )
                      ) : (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2">
                          <Lock className="h-3 w-3 shrink-0 text-muted" strokeWidth={1.5} />
                          <Link href={`/assinar?from=/p/${profile.slug}`} className="text-base text-coral hover:underline">
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

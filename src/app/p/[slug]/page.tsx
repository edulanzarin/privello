import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Star, ShieldCheck, Video, Clock3, Lock } from "lucide-react";
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
import { getProfileBySlug, getStoriesForProfile, isSubscriber, getUserReviewForProfile } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const PLAN_BADGE: Record<string, { bg: string; label: string }> = {
  PREMIUM: { bg: "bg-coral",       label: "PREMIUM" },
  DESTAQUE: { bg: "bg-foreground", label: "PLUS"    },
  ESSENCIAL: { bg: "bg-black/60",  label: "BASIC"   },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const profile = await getProfileBySlug(slug, session?.user?.id);
  if (!profile) notFound();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
  if (profile.isSuspended && !isAdmin) notFound();

  let isProvider = false;
  let ownerView = false;
  if (session?.user?.id) {
    try {
      const viewerProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (viewerProfile) {
        isProvider = true;
        ownerView = viewerProfile.id === profile.id;
      }
    } catch {
      isProvider = session.user.role === "PROVIDER";
    }
  }

  const initialFavorited = !isProvider && isLoggedIn ? await getFavoriteStatus(profile.id) : false;

  // Stories ativos deste perfil
  const storyGroup = await getStoriesForProfile(profile.id, session?.user?.id);
  const isClientUser = isLoggedIn && !isProvider;
  const isSubscriberViewer = isClientUser && session?.user?.id ? await isSubscriber(session.user.id) : false;
  const userReview = isClientUser && session?.user?.id
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
  const seals: { icon: typeof ShieldCheck; label: string; sub: string }[] = [];
  if (profile.isVerified) {
    seals.push({ icon: ShieldCheck, label: "Identidade verificada", sub: "Documento + selfie" });
  }
  if (profile.videoVerified) {
    seals.push({ icon: Video, label: "Vídeo verificado", sub: "Gravação autenticada" });
  }
  seals.push({ icon: Clock3, label: `Membro há ${monthsVerified} meses`, sub: `Desde ${memberLabel}` });

  return (
    <>
      <SiteHeader activeHref={`/descobrir/${profile.city.slug}`} />
      {!isProvider && !ownerView && <ViewTracker profileId={profile.id} />}
      {ownerView  && <ProviderBanner variant="own-profile" />}
      {isProvider && !ownerView && <ProviderBanner variant="other-profile" />}

      <main className="min-h-screen pb-28">

        {/* ── Breadcrumb ── */}
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:px-6">
            <Link href={`/descobrir/${profile.city.slug}`} className="hover:text-foreground">Descobrir</Link>
            {" / "}{profile.city.name} / {profile.district.name} / {profile.displayName}
          </div>
        </div>

        {/* ── Hero section ── */}
        <section className="relative bg-[#0e0e0e] overflow-hidden">

          {/* Blurred background from cover photo */}
          {cover?.url && (
            <div className="absolute inset-0 opacity-20">
              <Image src={cover.url} alt="" fill className="object-cover scale-110 blur-2xl" sizes="100vw" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e0e0e]/40 to-[#0e0e0e]/80" />

          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[400px_1fr] lg:items-start">

              {/* ── Left: Cover photo ── */}
              <div className="mx-auto w-full max-w-xs lg:max-w-none lg:mx-0">
                <ProfileStoryCover
                  storyGroup={storyGroup}
                  coverUrl={cover?.url ?? null}
                  displayName={profile.displayName}
                  planBadge={planBadge}
                  isClient={isClientUser}
                />
              </div>

              {/* ── Right: Info ── */}
              <div className="flex flex-col gap-0 lg:py-4">

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {profile.isOnline && (
                    <span className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online agora
                    </span>
                  )}
                  {profile.isVerified && (
                    <span className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                      <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Verificada
                    </span>
                  )}
                  {profile.videoVerified && (
                    <span className="flex items-center gap-1.5 border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-400">
                      <Video className="h-3 w-3" strokeWidth={2} /> Vídeo verificada
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-4xl font-light text-white sm:text-5xl lg:text-6xl leading-none">
                  {profile.displayName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/50 text-sm">
                  <span className="font-semibold text-white/70">{profile.age} anos</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {profile.district.name}, {profile.city.name}
                  </span>
                  {profile.ratingCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-coral text-coral" strokeWidth={0} />
                        <span className="text-white/70 font-medium">{profile.ratingAvg.toFixed(1)}</span>
                        <span className="text-white/40">({profile.ratingCount})</span>
                      </span>
                    </>
                  )}
                </div>

                {profile.tagline && (
                  <p className="mt-5 font-serif text-lg italic text-white/60 leading-snug max-w-md">
                    &ldquo;{profile.tagline}&rdquo;
                  </p>
                )}

                {/* Audio player */}
                {profile.audioUrl && (
                  <div className="mt-5">
                    <AudioPlayer src={profile.audioUrl} />
                  </div>
                )}

                {/* Price highlight */}
                <div className="mt-6 inline-flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{formatBrl(profile.priceHour)}</span>
                  <span className="text-white/40 text-sm">/hora</span>
                  {profile.priceTwoHours && (
                    <span className="text-white/40 text-sm ml-3">{formatBrl(profile.priceTwoHours)}<span className="text-xs">/2h</span></span>
                  )}
                </div>

                {/* Verification seals — horizontal */}
                {seals.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {seals.map((s) => (
                      <div key={s.label} className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 backdrop-blur-sm">
                        <s.icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={1.5} />
                        <span className="font-medium text-white/80">{s.label}</span>
                        <span className="text-white/40">· {s.sub}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap gap-3">
                  {!isProvider && (
                    <>
                      <Link
                        href={`/solicitar/${profile.slug}`}
                        className="inline-flex items-center justify-center gap-2 bg-coral px-7 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-coral/90 transition shadow-lg shadow-coral/30"
                      >
                        Marcar horário
                      </Link>
                      <WhatsAppButton phone={profile.whatsappPhone} profileId={profile.id} />
                      <FavoriteButton profileId={profile.id} initialFavorited={initialFavorited} isLoggedIn={isLoggedIn} />
                    </>
                  )}
                  <ShareButton displayName={profile.displayName} slug={profile.slug} />
                  {ownerView && (
                    <Link href="/painel/perfil" className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition backdrop-blur-sm">
                      Editar perfil
                    </Link>
                  )}
                </div>

                {/* Quick stats */}
                <div className="mt-8 grid grid-cols-2 gap-2 max-w-xs">
                  <div className="border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Visualizações</p>
                    <p className="mt-1 text-sm font-bold text-white">{profile.viewsThisMonth.toLocaleString("pt-BR")}<span className="text-white/40 font-normal text-xs"> /mês</span></p>
                  </div>
                  <div className="border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Membro desde</p>
                    <p className="mt-1 text-sm font-bold text-white">{memberLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Media Gallery (tabs: Fotos | Vídeos | Reels) ── */}
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
        <section className="border-t border-line bg-[#f9f9f7] py-14">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">

            <div className="space-y-10">
              <div>
                <h2 className="font-serif text-2xl">Quem sou</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
                  {profile.bio.split("\n").map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Características</h3>
                  <ul className="mt-3 space-y-1 text-sm">
                    {[
                      ["Altura",    profile.heightCm ? `${(profile.heightCm / 100).toFixed(2).replace(".", ",")} m` : "—"],
                      ["Manequim",  profile.dressSize ?? "—"],
                      ["Cabelo",    profile.hair ?? "—"],
                      ["Olhos",     profile.eyes ?? "—"],
                      ["Idiomas",   profile.languages ?? "—"],
                    ].map(([k, v]) => (
                      <li key={String(k)} className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">{k}</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Valores</h3>
                  <ul className="mt-3 space-y-1 text-sm">
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">1 hora</span>
                      <span className="font-medium">{formatBrl(profile.priceHour)}</span>
                    </li>
                    {profile.priceTwoHours ? (
                      <li className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">2 horas</span>
                        <span className="font-medium">{formatBrl(profile.priceTwoHours)}</span>
                      </li>
                    ) : null}
                    {profile.priceOvernight ? (
                      <li className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">Pernoite</span>
                        <span className="font-medium">{formatBrl(profile.priceOvernight)}</span>
                      </li>
                    ) : null}
                    {profile.priceTravelDay ? (
                      <li className="flex justify-between border-b border-line py-2">
                        <span className="text-muted">Viagem (diária)</span>
                        <span className="font-medium">{formatBrl(profile.priceTravelDay)}</span>
                      </li>
                    ) : null}
                    <li className="flex justify-between border-b border-line py-2">
                      <span className="text-muted">Pagamento</span>
                      <span>{profile.paymentMethods ?? "—"}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted">Atende a</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["Homens",                profile.servesMen],
                    ["Casais",                profile.servesCouples],
                    ["Mulheres",              profile.servesWomen],
                    ["Local próprio",         profile.hasOwnPlace],
                    ["Hotel / domicílio",     profile.homeVisit],
                    ["Viagens nacionais",     profile.travelsNational],
                    ["Viagens internacionais",profile.travelsInternational],
                  ].map(([label, on]) => (
                    <span
                      key={String(label)}
                      className={cn(
                        "border px-2.5 py-1 text-xs",
                        on ? "border-foreground bg-foreground text-white" : "border-line text-muted line-through",
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl">Esta semana</h2>
              <ul className="mt-6 space-y-1 text-sm">
                {profile.availabilityRules.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b border-line py-2">
                    <span>{dias[r.weekday]} · {r.startTime} – {r.endTime}</span>
                    <span className="text-xs font-medium uppercase">
                      {r.status === "CLOSED" ? (
                        <span className="text-muted">Fechado</span>
                      ) : r.status === "BUSY" ? (
                        <span className="text-coral">Ocupada</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />Disponível
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {!isProvider && (
                <>
                  <Link
                    href={`/solicitar/${profile.slug}`}
                    className="mt-6 flex w-full items-center justify-center bg-coral py-3 text-sm font-semibold text-white hover:bg-coral/90 transition"
                  >
                    Montar horário → WhatsApp
                  </Link>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Escolha dia, horário e duração. Abrimos o WhatsApp com texto pronto — sem intermediários.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section className="border-t border-line py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-3xl">
                {profile.ratingAvg > 0 ? (
                  <>{profile.ratingAvg.toFixed(1)} <span className="text-xl text-muted">· {profile.ratingCount} avaliações</span></>
                ) : (
                  <span className="text-2xl text-muted">Sem avaliações ainda</span>
                )}
              </h2>
              {/* CTA for eligible clients */}
              {isClientUser && !ownerView && (
                isSubscriberViewer ? (
                  <Link
                    href={`/avaliar/${profile.slug}`}
                    className="shrink-0 border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-white transition"
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
                  <article key={r.id} className="border border-line bg-white p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-white">
                        {(r.user.name ?? "?")[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {r.user.slug ? `@${r.user.slug}` : r.user.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          <span className="ml-1">{r.createdAt.toLocaleDateString("pt-BR")}</span>
                        </p>
                      </div>
                    </div>
                    {isSubscriberViewer ? (
                      r.comment && (
                        <p className="mt-4 text-sm italic leading-relaxed text-muted">{r.comment}</p>
                      )
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded bg-line/50 px-3 py-2">
                        <Lock className="h-3 w-3 shrink-0 text-muted" strokeWidth={1.5} />
                        <Link href={`/assinar?from=/p/${profile.slug}`} className="text-xs text-coral hover:underline">
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
      <SiteFooter />
    </>
  );
}

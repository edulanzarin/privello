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
import { DAYS_PT } from "@/lib/constants";

export const dynamic = "force-dynamic";

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

  // Any logged-in user can interact (favorite, like, etc.) — except on their own profile
  const canInteract = isLoggedIn && !ownerView;
  const initialFavorited = canInteract ? await getFavoriteStatus(profile.id) : false;

  // Stories ativos deste perfil
  const storyGroup = await getStoriesForProfile(profile.id, session?.user?.id);
  const isClientUser = isLoggedIn && !ownerView;
  const isSubscriberViewer = session?.user?.id ? await isSubscriber(session.user.id) : false;
  const userReview = isLoggedIn && !ownerView && !isProvider && session?.user?.id
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
      {!ownerView && <ViewTracker profileId={profile.id} />}
      {ownerView && <ProviderBanner variant="own-profile" />}
      {isProvider && !ownerView && <ProviderBanner variant="other-profile" />}

      <main className="min-h-screen pb-28">

        {/* ── Breadcrumb ── */}
        <div className="border-b border-black/[0.06]">
          <div className="mx-auto max-w-4xl px-4 py-3 text-[11px] font-medium text-muted sm:px-6">
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
                    <span className="flex items-center gap-1.5 rounded-full bg-[#30d158]/10 px-2.5 py-[3px] text-[11px] font-semibold text-[#248a3d]">
                      <span className="h-[6px] w-[6px] rounded-full bg-[#30d158] animate-pulse" /> Online
                    </span>
                  )}
                  {profile.isVerified && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#0a84ff]/10 px-2.5 py-[3px] text-[11px] font-semibold text-[#0a84ff]">
                      <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Verificada
                    </span>
                  )}
                  {profile.videoVerified && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#5856d6]/10 px-2.5 py-[3px] text-[11px] font-semibold text-[#5856d6]">
                      <Video className="h-3 w-3" strokeWidth={2} /> Vídeo
                    </span>
                  )}
                </div>

                <h1 className="text-[32px] font-bold tracking-tight text-foreground sm:text-[38px] leading-none">
                  {profile.displayName}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-[14px] text-muted">
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
                        <Star className="h-3.5 w-3.5 fill-[#ff9500] text-[#ff9500]" strokeWidth={0} />
                        <span className="font-medium text-foreground">{profile.ratingAvg.toFixed(1)}</span>
                        <span className="text-muted">({profile.ratingCount})</span>
                      </span>
                    </>
                  )}
                </div>

                {profile.tagline && (
                  <p className="mt-3 text-[15px] italic text-muted leading-snug max-w-md">
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
                  <span className="text-[28px] font-bold text-foreground">{formatBrl(profile.priceHour)}</span>
                  <span className="text-muted text-[14px]">/hora</span>
                  {profile.priceTwoHours && (
                    <span className="text-muted text-[13px] ml-3">{formatBrl(profile.priceTwoHours)}<span className="text-[11px]">/2h</span></span>
                  )}
                </div>

                {/* Verification seals */}
                {seals.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {seals.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 rounded-lg bg-black/[0.03] px-3 py-1.5 text-[12px]">
                        <s.icon className="h-3.5 w-3.5 shrink-0 text-[#30d158]" strokeWidth={1.5} />
                        <span className="font-medium text-foreground">{s.label}</span>
                        <span className="text-muted">· {s.sub}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {!ownerView && (
                    <>
                      <Link
                        href={`/solicitar/${profile.slug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
                      >
                        Marcar horário
                      </Link>
                      <WhatsAppButton phone={profile.whatsappPhone} profileId={profile.id} />
                      <FavoriteButton profileId={profile.id} initialFavorited={initialFavorited} isLoggedIn={isLoggedIn} />
                    </>
                  )}
                  <ShareButton displayName={profile.displayName} slug={profile.slug} />
                  {ownerView && (
                    <Link href="/painel/perfil" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.97]">
                      Editar perfil
                    </Link>
                  )}
                </div>

                {/* Quick stats */}
                <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs">
                  <div className="rounded-lg bg-black/[0.03] px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted">Visualizações</p>
                    <p className="mt-0.5 text-[14px] font-semibold">{profile.viewsThisMonth.toLocaleString("pt-BR")}<span className="text-muted font-normal text-[11px]"> /mês</span></p>
                  </div>
                  <div className="rounded-lg bg-black/[0.03] px-3 py-2.5">
                    <p className="text-[11px] font-medium text-muted">Membro desde</p>
                    <p className="mt-0.5 text-[14px] font-semibold">{memberLabel}</p>
                  </div>
                </div>
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
        <section className="border-t border-black/[0.06] bg-[#f5f5f7] py-14">
          <div className="mx-auto grid max-w-4xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">

            <div className="space-y-8">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight">Quem sou</h2>
                <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-muted">
                  {profile.bio.split("\n").map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-[11px] font-medium text-muted">Características</h3>
                  <ul className="mt-3 space-y-0">
                    {[
                      ["Altura", profile.heightCm ? `${(profile.heightCm / 100).toFixed(2).replace(".", ",")} m` : "—"],
                      ["Manequim", profile.dressSize ?? "—"],
                      ["Cabelo", profile.hair ?? "—"],
                      ["Olhos", profile.eyes ?? "—"],
                      ["Idiomas", profile.languages ?? "—"],
                    ].map(([k, v]) => (
                      <li key={String(k)} className="flex justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                        <span className="text-muted">{k}</span>
                        <span className="font-medium">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[11px] font-medium text-muted">Valores</h3>
                  <ul className="mt-3 space-y-0">
                    <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                      <span className="text-muted">1 hora</span>
                      <span className="font-semibold">{formatBrl(profile.priceHour)}</span>
                    </li>
                    {profile.priceTwoHours ? (
                      <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                        <span className="text-muted">2 horas</span>
                        <span className="font-semibold">{formatBrl(profile.priceTwoHours)}</span>
                      </li>
                    ) : null}
                    {profile.priceOvernight ? (
                      <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                        <span className="text-muted">Pernoite</span>
                        <span className="font-semibold">{formatBrl(profile.priceOvernight)}</span>
                      </li>
                    ) : null}
                    {profile.priceTravelDay ? (
                      <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                        <span className="text-muted">Viagem (diária)</span>
                        <span className="font-semibold">{formatBrl(profile.priceTravelDay)}</span>
                      </li>
                    ) : null}
                    <li className="flex justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                      <span className="text-muted">Pagamento</span>
                      <span className="font-medium">{profile.paymentMethods ?? "—"}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-medium text-muted">Atende a</h3>
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
                        "rounded-full px-3 py-1 text-[12px] font-medium",
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
              <h2 className="text-[20px] font-semibold tracking-tight">Esta semana</h2>
              <ul className="mt-4 space-y-0">
                {profile.availabilityRules.map((r) => (
                  <li key={r.id} className="flex items-center justify-between border-b border-black/[0.05] py-2.5 text-[13px]">
                    <span>{DAYS_PT[r.weekday]} · {r.startTime} – {r.endTime}</span>
                    <span className="text-[11px] font-medium uppercase">
                      {r.status === "CLOSED" ? (
                        <span className="text-muted">Fechado</span>
                      ) : r.status === "BUSY" ? (
                        <span className="text-coral">Ocupada</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#248a3d]">
                          <span className="h-[5px] w-[5px] rounded-full bg-[#30d158]" />Disponível
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
                    className="mt-6 flex w-full items-center justify-center rounded-full bg-coral py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    Montar horário → WhatsApp
                  </Link>
                  <p className="mt-3 text-[12px] leading-relaxed text-muted text-center">
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
              <h2 className="text-[22px] font-semibold tracking-tight">
                {profile.ratingAvg > 0 ? (
                  <>{profile.ratingAvg.toFixed(1)} <span className="text-[16px] text-muted font-normal">· {profile.ratingCount} avaliações</span></>
                ) : (
                  <span className="text-2xl text-muted">Sem avaliações ainda</span>
                )}
              </h2>
              {/* CTA for eligible clients */}
              {isClientUser && !ownerView && (
                isSubscriberViewer ? (
                  <Link
                    href={`/avaliar/${profile.slug}`}
                    className="shrink-0 rounded-lg border border-foreground px-4 py-2 text-[13px] font-semibold text-foreground transition hover:bg-foreground hover:text-white active:scale-[0.97]"
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
                        <p className="text-[14px] font-semibold">
                          {r.user.slug ? `@${r.user.slug}` : r.user.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          <span className="ml-1">{r.createdAt.toLocaleDateString("pt-BR")}</span>
                        </p>
                      </div>
                    </div>
                    {isSubscriberViewer ? (
                      r.comment && (
                        <p className="mt-4 text-[14px] italic leading-relaxed text-muted">{r.comment}</p>
                      )
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2">
                        <Lock className="h-3 w-3 shrink-0 text-muted" strokeWidth={1.5} />
                        <Link href={`/assinar?from=/p/${profile.slug}`} className="text-[13px] text-coral hover:underline">
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

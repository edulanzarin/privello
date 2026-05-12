import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star, ShieldCheck, Video, Clock3, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProviderBanner } from "@/components/layout/provider-banner";
import { ViewTracker } from "@/components/profile/view-tracker";
import { FavoriteButton } from "@/components/profile/favorite-button";
import { WhatsAppButton } from "@/components/profile/whatsapp-button";
import { MediaTabs } from "@/components/profile/media-tabs";
import { AudioPlayer } from "@/components/profile/audio-player";
import { auth } from "@/lib/auth";
import { getFavoriteStatus } from "@/app/_actions/favorites";
import { formatBrl } from "@/lib/money";
import { getProfileBySlug } from "@/lib/queries";
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
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

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

  const publicMedia = profile.media.filter((m) => m.isPublic);
  const privateCount = profile.media.filter((m) => !m.isPublic).length;
  const cover = publicMedia.find((m) => m.isCover) ?? publicMedia[0];

  const memberLabel = profile.memberSince.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  const monthsVerified = Math.max(0, Math.floor((Date.now() - profile.memberSince.getTime()) / (30.44 * 86400000)));

  const rs = profile.reviews;
  const fallback = profile.ratingAvg;
  const avgDim = (get: (r: (typeof rs)[0]) => number) =>
    rs.length ? rs.reduce((a, r) => a + get(r), 0) / rs.length : fallback;
  const dims = [
    ["Pontualidade", avgDim((r) => r.punctuality)],
    ["Descrição",    avgDim((r) => r.descriptionScore)],
    ["Conversa",     avgDim((r) => r.conversation)],
    ["Experiência",  avgDim((r) => r.experience)],
  ] as const;

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

      <main className="min-h-screen pb-20">

        {/* ── Breadcrumb ── */}
        <div className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:px-6">
            <Link href={`/descobrir/${profile.city.slug}`} className="hover:text-foreground">Descobrir</Link>
            {" / "}{profile.city.name} / {profile.district.name} / {profile.displayName}
          </div>
        </div>

        {/* ── Hero section ── */}
        <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {profile.isOnline && (
              <span className="flex items-center gap-1.5 border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online agora
              </span>
            )}
            {profile.isVerified && (
              <span className="flex items-center gap-1.5 border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                <ShieldCheck className="h-3 w-3" strokeWidth={2} /> Verificada
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">

            {/* ── Left: Info ── */}
            <div className="flex flex-col gap-0">
              <h1 className="font-serif text-4xl font-light sm:text-5xl">
                {profile.displayName}<span className="text-muted">, {profile.age}</span>
              </h1>
              <p className="mt-1 text-sm text-muted/50">@{profile.slug}</p>

              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {profile.district.name} · {profile.city.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-coral text-coral" strokeWidth={0} />
                  {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} avaliações
                </span>
              </p>

              {profile.tagline && (
                <p className="mt-6 font-serif text-xl italic text-foreground/80 leading-snug">
                  &ldquo;{profile.tagline}&rdquo;
                </p>
              )}

              {/* Audio player */}
              {profile.audioUrl && <AudioPlayer src={profile.audioUrl} />}

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                {!isProvider && (
                  <>
                    <Link
                      href={`/solicitar/${profile.slug}`}
                      className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-white hover:bg-foreground/80 transition"
                    >
                      Marcar horário
                    </Link>
                    {profile.whatsappPhone && (
                      <WhatsAppButton
                        phone={profile.whatsappPhone}
                        profileId={profile.id}
                        source="Botão do perfil"
                        className="inline-flex items-center justify-center gap-2 bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral/90 transition"
                      />
                    )}
                    <FavoriteButton profileId={profile.id} initialFavorited={initialFavorited} isLoggedIn={isLoggedIn} />
                  </>
                )}
                {ownerView && (
                  <Link href="/painel/perfil" className="inline-flex items-center justify-center gap-2 border border-foreground px-6 py-3 text-sm font-semibold text-foreground hover:bg-foreground hover:text-white transition">
                    Editar perfil
                  </Link>
                )}
              </div>

              {/* Verification seals */}
              <div className="mt-8 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Selos de confiança</p>
                {seals.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 border border-line bg-white px-4 py-3">
                    <s.icon className="h-4 w-4 shrink-0 text-success" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-medium leading-none">{s.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Visualizações", `${profile.viewsThisMonth.toLocaleString("pt-BR")} este mês`],
                  ["Última atualização", profile.lastUpdatedAt.toLocaleDateString("pt-BR")],
                ].map(([k, v]) => (
                  <div key={String(k)} className="border border-line bg-white px-3 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</dt>
                    <dd className="mt-1 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── Right: Cover photo ── */}
            <div className="relative overflow-hidden bg-line lg:aspect-[3/4]">
              {cover ? (
                <Image
                  src={cover.url}
                  alt={profile.displayName}
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 400px"
                  priority
                />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center bg-line">
                  <p className="text-sm text-muted">Sem foto</p>
                </div>
              )}
              {/* Plan badge */}
              <div className={cn(
                "absolute inset-x-0 bottom-0 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white",
                planBadge.bg,
              )}>
                {planBadge.label}
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* ── Media Gallery (tabs: Fotos | Vídeos) ── */}
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <MediaTabs
              photos={publicMedia}
              privateCount={privateCount}
              displayName={profile.displayName}
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
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-serif text-3xl">
                {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} avaliações
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                {dims.map(([k, v]) => (
                  <div key={String(k)}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</p>
                    <p className="mt-1 text-lg font-medium">{Number.isFinite(v) ? Number(v).toFixed(1) : "—"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {profile.reviews.map((r) => (
                <article key={r.id} className="border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-white">
                      {r.reviewerInitials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.reviewerName}</p>
                      <p className="text-xs text-muted">{r.createdAt.toLocaleDateString("pt-BR")} · {r.rating.toFixed(1)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm italic leading-relaxed text-muted">{r.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

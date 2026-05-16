import Image from "next/image";
import Link from "next/link";
import { MapPin, Home, Car, Images, Clapperboard, Star, ShieldCheck } from "lucide-react";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProfileCardPayload } from "@/lib/services";
import { AudioPlayButton } from "@/components/profile/audio-play-button";

type ProfileCardProps = {
  profile: ProfileCardPayload;
  className?: string;
  storyRing?: "unseen" | "seen" | "none";
};

const PLAN_CONFIG = {
  BOOST: {
    wrapClass: "ring-2 ring-warning/60",
    badgeBg: "bg-warning",
    badgeText: "text-white",
    badgeLabel: "BOOST",
  },
  PREMIUM: {
    wrapClass: "ring-[1.5px] ring-coral/50",
    badgeBg: "bg-coral/90",
    badgeText: "text-white",
    badgeLabel: "PREMIUM",
  },
  DESTAQUE: {
    wrapClass: "ring-[1px] ring-black/10",
    badgeBg: "bg-black/60",
    badgeText: "text-white",
    badgeLabel: "PLUS",
  },
  ESSENCIAL: {
    wrapClass: "ring-[0.5px] ring-black/[0.07]",
    badgeBg: null,
    badgeText: null,
    badgeLabel: null,
  },
} as const;

/**
 * Card de perfil em grid (variação default usada em listagens "Em destaque", "Em alta",
 * "Descobrir" e seção home), com foto de capa, badges de plano/verificação, preço,
 * tira de fotos extras e botão de áudio quando disponível.
 *
 * Props:
 * - `profile` (ProfileCardPayload): payload retornado por `discover.service` (tipo Prisma com city/district/media).
 * - `className?` (string): classes Tailwind extras encaminhadas ao link raiz.
 * - `storyRing?` ("unseen" | "seen" | "none"): adiciona aro de story por cima do card (default `"none"`).
 *
 * Consumidores conhecidos:
 * - src/app/em-destaque/page.tsx
 * - src/app/em-alta/page.tsx
 * - src/app/descobrir/[citySlug]/page.tsx
 * - src/components/home/profile-section.tsx
 *
 * Side effects:
 * - Renderiza `<Link href="/p/[slug]">` (navegação client-side).
 * - Componente filho `<AudioPlayButton>` instancia `Audio` no clique (cf. arquivo dele).
 */
export function ProfileCard({ profile, className, storyRing = "none" }: ProfileCardProps) {
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";

  // Media breakdown by type — videos and reels are unified
  const photos = profile.media.filter((m) => m.mediaType !== "REEL" && m.mediaType !== "VIDEO");
  const hasReels = profile.media.some((m) => m.mediaType === "REEL" || m.mediaType === "VIDEO");

  // Extra photos for thumbnail strip (not cover, images only)
  const extraPhotos = profile.media
    .filter((m) => m.url !== imageUrl && m.mediaType !== "REEL" && m.mediaType !== "VIDEO")
    .slice(0, 2);

  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();
  const plan = isBoosted ? PLAN_CONFIG.BOOST : (PLAN_CONFIG[profile.planTier] ?? PLAN_CONFIG.ESSENCIAL);

  const audioUrl = (profile as typeof profile & { audioUrl?: string | null }).audioUrl;
  const hasAttributes = profile.hasOwnPlace || profile.homeVisit || profile.videoVerified || hasReels || audioUrl;

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_20px_48px_rgba(0,0,0,0.1)] hover:-translate-y-0.5",
        plan.wrapClass,
        className,
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/[0.04]">
        <Image
          src={imageUrl}
          alt={profile.displayName}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width:768px) 50vw, 33vw"
        />

        {/* Bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Top: verified badge */}
        {profile.isVerified && (
          <div className="absolute right-2.5 top-2.5">
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-2xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-2.5 w-2.5 text-blue" strokeWidth={2} />
              Verificada
            </span>
          </div>
        )}

        {/* Bottom: plan badge + price */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-2.5">
          {plan.badgeLabel ? (
            <span className={cn(
              "rounded-full px-2.5 py-[3px] text-2xs font-bold tracking-[0.12em] uppercase",
              plan.badgeBg, plan.badgeText,
            )}>
              {plan.badgeLabel}
            </span>
          ) : <span />}

          <span className="text-xl font-semibold leading-none tabular-nums text-white drop-shadow-sm">
            {formatBrl(profile.priceHour)}
            <span className="text-xs font-normal opacity-70">/h</span>
          </span>
        </div>
      </div>

      {/* Extra photo strip */}
      {extraPhotos.length > 0 && (
        <div className="flex h-[52px] gap-px overflow-hidden bg-black/[0.04]">
          {extraPhotos.map((m, i) => (
            <div key={i} className="relative flex-1 overflow-hidden">
              <Image src={m.url} alt="" fill className="object-cover" sizes="80px" />
            </div>
          ))}
          {extraPhotos.length === 1 && <div className="flex-1 bg-black/[0.03]" />}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3.5 pb-3">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-semibold leading-tight tracking-tight">
            {profile.displayName}, {profile.age}
          </p>
          {profile.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs">
              <Star className="h-2.5 w-2.5 fill-warning text-warning" strokeWidth={0} />
              <span className="font-semibold">{profile.ratingAvg.toFixed(1)}</span>
              <span className="text-muted">({profile.ratingCount})</span>
            </span>
          )}
        </div>

        {/* Tagline */}
        {profile.tagline && (
          <p className="line-clamp-1 text-sm italic leading-snug text-muted">
            &ldquo;{profile.tagline}&rdquo;
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
          <span className="truncate">{profile.district?.name ? `${profile.district.name} · ` : ""}{profile.city.name}</span>
        </div>

        {/* Attribute badges */}
        {hasAttributes && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {photos.length > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-black/[0.07] px-2 py-[3px] text-2xs text-muted">
                <Images className="h-2.5 w-2.5" strokeWidth={1.5} />
                {photos.length}
              </span>
            )}
            {hasReels && (
              <span className="flex items-center gap-1 rounded-full border border-black/[0.07] px-2 py-[3px] text-2xs text-muted">
                <Clapperboard className="h-2.5 w-2.5" strokeWidth={1.5} />
                Reels
              </span>
            )}
            {profile.videoVerified && (
              <span className="flex items-center gap-1 rounded-full border border-blue/20 bg-blue/[0.06] px-2 py-[3px] text-2xs text-blue">
                <ShieldCheck className="h-2.5 w-2.5" strokeWidth={1.5} />
                Vídeo verificado
              </span>
            )}
            {profile.hasOwnPlace && (
              <span className="flex items-center gap-1 rounded-full border border-black/[0.07] px-2 py-[3px] text-2xs text-muted">
                <Home className="h-2.5 w-2.5" strokeWidth={1.5} />
                Local
              </span>
            )}
            {profile.homeVisit && (
              <span className="flex items-center gap-1 rounded-full border border-black/[0.07] px-2 py-[3px] text-2xs text-muted">
                <Car className="h-2.5 w-2.5" strokeWidth={1.5} />
                Atende
              </span>
            )}
          </div>
        )}

        {/* Audio button */}
        {audioUrl && (
          <div className="pt-0.5">
            <AudioPlayButton src={audioUrl} />
          </div>
        )}
      </div>

      {/* Story ring */}
      {storyRing !== "none" && (
        <div className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl",
          storyRing === "unseen" ? "ring-[3px] ring-coral/70" : "ring-2 ring-black/10",
        )} />
      )}
    </Link>
  );
}

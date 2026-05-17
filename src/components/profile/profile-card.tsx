import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Star, Video, Sparkles } from "lucide-react";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProfileCardPayload } from "@/lib/services";
import { AudioPlayButton } from "@/components/profile/audio-play-button";

type ProfileCardProps = {
  profile: ProfileCardPayload;
  className?: string;
  storyRing?: "unseen" | "seen" | "none";
};

/**
 * ProfileCard — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/profile/profile-card.tsx
 * Steering: `.kiro/steering/design-system.md` §13.4 (decisão F1).
 *
 * Visual:
 *  - Foto 3:4 fullbleed. Card `rounded-3xl overflow-hidden` (24px).
 *  - SEM chrome em volta da foto (decisão F1).
 *  - Badges flutuam top-3 left-3 em `.glass-pill` size sm.
 *  - Glass strip rodapé (`.glass-strip`) com nome + cidade + preço + audio.
 *  - Hover desktop: foto `scale-[1.03]` 200ms easing tahoe; ring sutil.
 *
 * Estados de plano (badges flutuantes):
 *  - BOOST (peach pill) — `featuredUntil > now`.
 *  - PREMIUM (plum pill).
 *  - DESTAQUE (cream/champagne pill).
 *  - ESSENCIAL — sem badge.
 *
 * Verificação:
 *  - `isVerified` → badge "✓ Verificada" (cream).
 *  - `videoVerified` → badge "▶ Vídeo verif." (info).
 *
 * Click → `/p/[slug]` com View Transition (`view-transition-name: profile-{id}`).
 *
 * Props:
 *  - `profile`: ProfileCardPayload (Prisma).
 *  - `className?`: classes extras.
 *  - `storyRing?`: ring de story externo ("unseen" rose | "seen" line | "none").
 */
export function ProfileCard({ profile, className, storyRing = "none" }: ProfileCardProps) {
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
  const audioUrl = (profile as typeof profile & { audioUrl?: string | null })
    .audioUrl;

  const isBoosted =
    profile.featuredUntil != null &&
    new Date(profile.featuredUntil) > new Date();

  const planBadge = (() => {
    if (isBoosted) {
      return {
        label: "Boost",
        Icon: Sparkles,
        bg: "bg-peach/95 text-white",
      };
    }
    if (profile.planTier === "PREMIUM") {
      return {
        label: "Premium",
        Icon: Sparkles,
        bg: "bg-plum/95 text-white",
      };
    }
    if (profile.planTier === "DESTAQUE") {
      return {
        label: "Plus",
        Icon: Sparkles,
        bg: "bg-cream/95 text-ink",
      };
    }
    return null;
  })();

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-3xl",
        "shadow-[var(--shadow-sm)]",
        "transition-all duration-200 ease-[var(--ease-tahoe)]",
        "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      style={{ viewTransitionName: `profile-${profile.id}` }}
    >
      {/* Foto fullbleed 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-line">
        <Image
          src={imageUrl}
          alt={profile.displayName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay para legibilidade do strip */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(20,15,17,0.55) 70%, rgba(20,15,17,0.85) 100%)",
          }}
          aria-hidden
        />

        {/* Badges flutuantes — top-left */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {planBadge && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider backdrop-blur-md",
                planBadge.bg,
              )}
            >
              <planBadge.Icon
                className="h-2.5 w-2.5"
                strokeWidth={2.2}
                aria-hidden
              />
              {planBadge.label}
            </span>
          )}

          {profile.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-2xs font-semibold text-ink backdrop-blur-md">
              <ShieldCheck
                className="h-2.5 w-2.5 text-rose"
                strokeWidth={2.2}
                aria-hidden
              />
              Verificada
            </span>
          )}

          {profile.videoVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-2xs font-semibold text-info backdrop-blur-md">
              <Video
                className="h-2.5 w-2.5"
                strokeWidth={2.2}
                aria-hidden
              />
              Vídeo
            </span>
          )}
        </div>

        {/* Online dot — top-right */}
        {profile.isOnline && (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-2xs font-semibold text-ink backdrop-blur-md"
            aria-label="Online"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Online
          </span>
        )}

        {/* Glass strip rodapé — info principal */}
        <div className="absolute inset-x-3 bottom-3 rounded-2xl glass-strip px-3 py-2.5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-md font-semibold leading-tight text-white">
                {profile.displayName}, {profile.age}
              </p>
              <p className="mt-0.5 truncate text-sm leading-tight text-white/80">
                {profile.district?.name
                  ? `${profile.district.name} · `
                  : ""}
                {profile.city.name}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end">
              <span className="text-md font-semibold leading-none tabular-nums text-white">
                {formatBrl(profile.priceHour)}
              </span>
              <span className="text-2xs leading-tight text-white/65">
                por hora
              </span>
            </div>
          </div>

          {/* Audio + rating row */}
          {(audioUrl || profile.ratingCount > 0) && (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/15 pt-2">
              {audioUrl ? (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="flex-1 min-w-0"
                >
                  <AudioPlayButton src={audioUrl} />
                </div>
              ) : (
                <span />
              )}

              {profile.ratingCount > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-2xs text-white/85">
                  <Star
                    className="h-3 w-3 fill-cream text-cream"
                    strokeWidth={0}
                    aria-hidden
                  />
                  <span className="font-semibold">
                    {profile.ratingAvg.toFixed(1)}
                  </span>
                  <span className="opacity-70">
                    ({profile.ratingCount})
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Story ring opcional (acima do card inteiro) */}
      {storyRing !== "none" && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl",
            storyRing === "unseen"
              ? "ring-2 ring-rose"
              : "ring-1 ring-line",
          )}
          aria-hidden
        />
      )}
    </Link>
  );
}

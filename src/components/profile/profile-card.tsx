import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Star, Video, Flame, Crown, Sparkles } from "lucide-react";
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
 * ProfileCard — Design System v2.1 (Tahoe Sensual, calibrado).
 *
 * Caminho: src/components/profile/profile-card.tsx
 * Steering: `.kiro/steering/design-system.md` §13.4 (decisão F1).
 *
 * Visual (v2.1 após feedback do user em 2026-05-17):
 *  - Foto 3:4 fullbleed. Card `rounded-2xl overflow-hidden` (16px, era 24px).
 *  - Sem chrome em volta da foto (decisão F1).
 *  - Glass strip rodapé MAIS opaco (rgba 0.62 + blur 16px, era 0.55+20).
 *  - Badges flutuantes em `bg-white/95` opaco com sombra-sm (era backdrop-blur).
 *  - Boost: Flame (chama, faz sentido com "boost") em peach.
 *  - Premium: Crown em plum.
 *  - Plus: Sparkles em cream.
 *  - Preço em `font-bold` no strip (mais contraste).
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
        Icon: Flame,
        bg: "bg-peach text-white",
      };
    }
    if (profile.planTier === "PREMIUM") {
      return {
        label: "Premium",
        Icon: Crown,
        bg: "bg-plum text-white",
      };
    }
    if (profile.planTier === "DESTAQUE") {
      return {
        label: "Plus",
        Icon: Sparkles,
        bg: "bg-cream text-ink",
      };
    }
    return null;
  })();

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl",
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
              "linear-gradient(180deg, transparent 0%, rgba(20,15,17,0.6) 70%, rgba(20,15,17,0.9) 100%)",
          }}
          aria-hidden
        />

        {/* Badges flutuantes — top-left */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {planBadge && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider",
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

          {profile.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-semibold text-ink shadow-[var(--shadow-sm)]">
              <ShieldCheck
                className="h-2.5 w-2.5 text-rose"
                strokeWidth={2.4}
                aria-hidden
              />
              Verificada
            </span>
          )}

          {profile.videoVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-semibold text-info shadow-[var(--shadow-sm)]">
              <Video
                className="h-2.5 w-2.5"
                strokeWidth={2.4}
                aria-hidden
              />
              Vídeo
            </span>
          )}
        </div>

        {/* Online dot — top-right */}
        {profile.isOnline && (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-2xs font-semibold text-ink shadow-[var(--shadow-sm)]"
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
        <div className="absolute inset-x-3 bottom-3 rounded-xl glass-strip px-3 py-2.5">
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
              <span className="text-md font-bold leading-none tabular-nums text-white">
                {formatBrl(profile.priceHour)}
              </span>
              <span className="text-2xs leading-tight text-white/70">
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
            "pointer-events-none absolute inset-0 rounded-2xl",
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

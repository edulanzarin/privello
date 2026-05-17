import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin,
  Video,
  Flame,
  Crown,
  Sparkles,
} from "lucide-react";
import type { ProfileCardPayload } from "@/lib/services";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * ProfileListRow — variação horizontal compacta do ProfileCard.
 *
 * Caminho: src/components/profile/profile-list-row.tsx
 * Steering: `.kiro/steering/design-system.md` §13.4 (alinhado com ProfileCard).
 *
 * Visual v2 (Tahoe Sensual):
 *  - Card branco rounded-2xl + border-line, mesma linguagem do ProfileCard.
 *  - Foto thumb 96×128 (3:4), com badge de plano flutuante top-left.
 *  - Info à direita: nome+idade, handle, cidade com pin, rating, preço rose.
 *  - Verificada e Vídeo viram pílulas pequenas inline (não badges floats).
 *  - Online dot pequeno antes do nome (se aplicável).
 *  - Chevron à direita pro affordance de navegação.
 *
 * Props:
 *  - `profile`: ProfileCardPayload (Prisma).
 *  - `className?`: classes extras.
 */
export function ProfileListRow({
  profile,
  className,
}: {
  profile: ProfileCardPayload;
  className?: string;
}) {
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";

  const isBoosted =
    profile.featuredUntil != null &&
    new Date(profile.featuredUntil) > new Date();

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

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl",
        "bg-white border border-line",
        "shadow-[var(--shadow-sm)]",
        "transition-all duration-200 ease-[var(--ease-tahoe)]",
        "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Foto thumb 3:4 */}
      <div className="relative h-32 w-24 shrink-0 overflow-hidden bg-line">
        <Image
          src={imageUrl}
          alt={profile.displayName}
          fill
          sizes="96px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        {planBadge && (
          <span
            className={cn(
              "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              "shadow-[var(--shadow-sm)]",
              planBadge.bg,
            )}
          >
            <planBadge.Icon className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden />
            {planBadge.label}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          {/* Linha 1: nome + idade + online */}
          <div className="flex items-center gap-2">
            {profile.isOnline && (
              <span
                className="relative flex h-1.5 w-1.5 shrink-0"
                aria-label="Online"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
            )}
            <p className="truncate text-md font-bold leading-tight text-ink">
              {profile.displayName}
              <span className="ml-1.5 text-sm font-medium text-ink-dim">
                {profile.age}
              </span>
            </p>
          </div>

          {/* Linha 2: cidade · bairro */}
          <p className="flex items-center gap-1 text-sm text-ink-dim">
            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            <span className="truncate">
              {profile.district?.name
                ? `${profile.district.name} · `
                : ""}
              {profile.city.name}
            </span>
          </p>

          {/* Linha 3: rating + verificações inline */}
          <div className="flex items-center gap-2 text-xs">
            {profile.ratingCount > 0 ? (
              <span className="flex items-center gap-1 text-ink-dim">
                <Star
                  className="h-3 w-3 fill-cream text-cream"
                  strokeWidth={0}
                  aria-hidden
                />
                <span className="font-semibold tabular-nums text-ink">
                  {profile.ratingAvg.toFixed(1)}
                </span>
                <span>({profile.ratingCount})</span>
              </span>
            ) : null}

            {profile.isVerified && (
              <span className="flex items-center gap-1 text-ink-dim">
                <ShieldCheck
                  className="h-3 w-3 text-rose"
                  strokeWidth={2.4}
                  aria-hidden
                />
                Verificada
              </span>
            )}

            {profile.videoVerified && (
              <span className="flex items-center gap-1 text-info">
                <Video className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                Vídeo
              </span>
            )}
          </div>
        </div>

        {/* Direita: preço + chevron */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-md font-bold tabular-nums text-rose">
              {formatBrl(profile.priceHour)}
            </span>
            <span className="text-xs text-ink-dim">/h</span>
          </div>
          <ChevronRight
            className="h-4 w-4 text-ink-dim transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-rose"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

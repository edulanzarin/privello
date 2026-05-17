import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  Video,
  Flame,
  Crown,
  Sparkles,
  MapPin,
  Volume2,
  Home,
  Car,
} from "lucide-react";
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
 * ProfileCard — Design System v2.4 (Tahoe Sensual, completo).
 *
 * Caminho: src/components/profile/profile-card.tsx
 * Steering: `.kiro/steering/design-system.md` §13.4.
 *
 * Visual (v2.4 após feedback "completinho" 2026-05-17):
 *  - Layout split: foto em cima (3:4) + área de info branca embaixo.
 *  - Foto NÃO mais fullbleed — agora retangular com cantos arredondados
 *    apenas na parte superior. Glass-strip sumiu.
 *  - Área de info: nome+idade, cidade com pin, audio (se houver), tags
 *    de serviço (Local próprio / A domicílio / Com áudio), preço destacado.
 *  - Card opaco branco, rounded-2xl total. Hover: foto faz zoom 1.03 +
 *    sombra ganha elevation.
 *  - Badges flutuantes na foto: Boost / Premium / Plus + Verificada / Vídeo.
 *  - Online badge top-right ainda na foto.
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

  // Tags de serviço — só renderiza as ativas
  const tags: { label: string; Icon: typeof Home }[] = [];
  if (profile.hasOwnPlace) tags.push({ label: "Com local", Icon: Home });
  if (profile.homeVisit) tags.push({ label: "A domicílio", Icon: Car });
  if (audioUrl) tags.push({ label: "Com áudio", Icon: Volume2 });

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl",
        "bg-white border border-line",
        "shadow-[var(--shadow-sm)]",
        "transition-all duration-200 ease-[var(--ease-tahoe)]",
        "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      style={{ viewTransitionName: `profile-${profile.id}` }}
    >
      {/* Foto 3:4 com badges flutuantes */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-line">
        <Image
          src={imageUrl}
          alt={profile.displayName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
      </div>

      {/* Área de info — branca, separada da foto */}
      <div className="flex flex-col gap-2.5 p-4">
        {/* Nome + idade + rating */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-bold leading-tight text-ink">
            {profile.displayName}
            <span className="ml-1.5 text-base font-medium text-ink-dim">
              {profile.age}
            </span>
          </p>
          {profile.ratingCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <Star
                className="h-3.5 w-3.5 fill-cream text-cream"
                strokeWidth={0}
                aria-hidden
              />
              <span className="font-semibold tabular-nums text-ink">
                {profile.ratingAvg.toFixed(1)}
              </span>
              <span className="text-ink-dim">
                ({profile.ratingCount})
              </span>
            </span>
          )}
        </div>

        {/* Cidade · bairro */}
        <div className="flex items-center gap-1.5 text-sm text-ink-dim">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate">
            {profile.district?.name ? `${profile.district.name} · ` : ""}
            {profile.city.name}
          </span>
        </div>

        {/* Audio inline (se houver) */}
        {audioUrl && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <AudioPlayButton src={audioUrl} />
          </div>
        )}

        {/* Tags de serviço */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-background px-2.5 py-0.5 text-2xs font-medium text-ink-dim"
              >
                <tag.Icon
                  className="h-2.5 w-2.5"
                  strokeWidth={2}
                  aria-hidden
                />
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Preço destacado */}
        <div className="mt-1 flex items-baseline gap-1.5 border-t border-line pt-2.5">
          <span className="text-xl font-bold tabular-nums text-rose">
            {formatBrl(profile.priceHour)}
          </span>
          <span className="text-sm text-ink-dim">/ hora</span>
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

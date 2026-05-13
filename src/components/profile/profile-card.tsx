import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProfileCardPayload } from "@/lib/queries";

type ProfileCardProps = {
  profile: ProfileCardPayload;
  className?: string;
  storyRing?: "unseen" | "seen" | "none";
};

const PLAN_CONFIG = {
  BOOST: {
    wrapClass:  "shadow-[0_0_0_3px_#f97316]",
    badgeBg:    "bg-orange-500/95",
    badgeText:  "text-white",
    badgeLabel: "BOOST",
    priceClass: "text-orange-500 font-bold",
    accentBar:  "border-t-2 border-orange-500",
  },
  PREMIUM: {
    wrapClass:  "shadow-[0_0_0_2px_#c8102e]",
    badgeBg:    "bg-coral/95",
    badgeText:  "text-white",
    badgeLabel: "PREMIUM",
    priceClass: "text-coral font-bold",
    accentBar:  "border-t-2 border-coral",
  },
  DESTAQUE: {
    wrapClass:  "shadow-[0_0_0_2px_#111]",
    badgeBg:    "bg-foreground/95",
    badgeText:  "text-white",
    badgeLabel: "PLUS",
    priceClass: "text-foreground font-semibold",
    accentBar:  "border-t-2 border-foreground",
  },
  ESSENCIAL: {
    wrapClass:  "shadow-[0_0_0_1px_#e5e5e0]",
    badgeBg:    "bg-black/60",
    badgeText:  "text-white/80",
    badgeLabel: "BASIC",
    priceClass: "text-muted font-medium",
    accentBar:  "border-t border-line",
  },
} as const;

export function ProfileCard({ profile, className, storyRing = "none" }: ProfileCardProps) {
  const cover    = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();
  const plan = isBoosted ? PLAN_CONFIG.BOOST : (PLAN_CONFIG[profile.planTier] ?? PLAN_CONFIG.ESSENCIAL);
  // lastActiveAt is a new field — cast until prisma generate runs after server restart
  const p = profile as typeof profile & { lastActiveAt?: Date | string | null };
  const isOnline = p.lastActiveAt != null &&
    (Date.now() - new Date(p.lastActiveAt).getTime()) < 5 * 60 * 1000;

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
        plan.wrapClass,
        className,
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-line">
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
          sizes="(max-width:768px) 50vw, 33vw"
        />

        {/* Dark gradient at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Top badges */}
        <div className="absolute inset-x-0 top-0 flex justify-between p-2.5">
          {profile.isVerified ? (
            <span className="flex items-center gap-1 bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-foreground backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Verificada
            </span>
          ) : <span />}
          {isOnline ? (
            <span className="flex items-center gap-1 bg-success/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Online
            </span>
          ) : <span />}
        </div>

        {/* Plan/boost badge */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm",
          plan.badgeBg, plan.badgeText,
        )}>
          {plan.badgeLabel}
        </div>
      </div>

      {/* Info panel */}
      <div className={cn("flex flex-col gap-2 p-3.5", plan.accentBar)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-[1.15rem] font-light leading-tight">
              {profile.displayName}, {profile.age}
            </p>
            {profile.tagline ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
                "{profile.tagline}"
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                {profile.district.name} · {profile.city.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-coral text-coral" strokeWidth={0} />
            <span className="font-semibold text-foreground">{profile.ratingAvg.toFixed(1)}</span>
            <span className="text-muted">· {profile.ratingCount} av.</span>
          </span>
          <span className={cn("text-sm", plan.priceClass)}>
            {formatBrl(profile.priceHour)}<span className="text-xs font-normal text-muted">/h</span>
          </span>
        </div>
      </div>

      {/* Story ring indicator */}
      {storyRing !== "none" && (
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          storyRing === "unseen"
            ? "ring-[3px] ring-gradient-to-br from-coral to-orange-400"
            : "ring-2 ring-line/60",
        )} />
      )}
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star, Zap } from "lucide-react";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProfileCardPayload } from "@/lib/queries";

type ProfileCardProps = {
  profile: ProfileCardPayload;
  className?: string;
};

const PLAN_CONFIG = {
  BOOST: {
    wrapClass:  "ring-[3px] ring-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]",
    badgeBg:    "bg-orange-500",
    badgeText:  "text-white",
    badgeLabel: "BOOST",
    priceClass: "text-orange-500 font-bold",
    infoBar:    "border-t-[3px] border-orange-500 bg-orange-50",
    nameClass:  "text-foreground",
  },
  PREMIUM: {
    wrapClass:  "ring-2 ring-coral",
    badgeBg:    "bg-coral",
    badgeText:  "text-white",
    badgeLabel: "PREMIUM",
    priceClass: "text-coral font-bold",
    infoBar:    "border-t-2 border-coral",
    nameClass:  "text-foreground",
  },
  DESTAQUE: {
    wrapClass:  "ring-2 ring-foreground",
    badgeBg:    "bg-foreground",
    badgeText:  "text-white",
    badgeLabel: "DESTAQUE",
    priceClass: "text-foreground font-semibold",
    infoBar:    "border-t-2 border-foreground",
    nameClass:  "text-foreground",
  },
  ESSENCIAL: {
    wrapClass:  "ring-1 ring-line",
    badgeBg:    "bg-line",
    badgeText:  "text-muted",
    badgeLabel: "ESSENCIAL",
    priceClass: "text-muted font-medium",
    infoBar:    "border-t border-line",
    nameClass:  "text-foreground",
  },
} as const;

export function ProfileCard({ profile, className }: ProfileCardProps) {
  const cover    = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();
  const plan = isBoosted ? PLAN_CONFIG.BOOST : (PLAN_CONFIG[profile.planTier] ?? PLAN_CONFIG.ESSENCIAL);

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden bg-white transition hover:shadow-lg",
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
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width:768px) 100vw, 33vw"
        />

        {/* Verified / Online */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3 text-[10px] font-semibold uppercase tracking-wide">
          {profile.isVerified ? (
            <span className="flex items-center gap-1 bg-white/95 px-2 py-1 text-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Verificada
            </span>
          ) : <span />}
          {profile.isOnline ? (
            <span className="flex items-center gap-1 bg-white/95 px-2 py-1 text-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Online
            </span>
          ) : <span />}
        </div>

        {/* Public code */}
        <span className="absolute bottom-8 left-3 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
          {profile.publicCode}
        </span>

        {/* Plan / boost badge */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]",
          plan.badgeBg, plan.badgeText,
        )}>
          {plan.badgeLabel}
        </div>
      </div>

      {/* Info */}
      <div className={cn("flex flex-1 flex-col gap-2 p-4", plan.infoBar)}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("font-serif text-xl font-light leading-tight", plan.nameClass)}>
              {profile.displayName}, {profile.age}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              {profile.district.name} · {profile.city.name}
            </p>
          </div>
          <ArrowUpRight
            className="h-5 w-5 shrink-0 text-muted transition group-hover:text-foreground"
            strokeWidth={1.25}
          />
        </div>

        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted">
            <Star className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
            <span className="font-medium text-foreground">{profile.ratingAvg.toFixed(1)}</span>
            <span className="text-xs">· {profile.ratingCount} av.</span>
          </span>
          <span className={cn("text-sm", plan.priceClass)}>
            {formatBrl(profile.priceHour)} /h
          </span>
        </div>
      </div>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star, Zap } from "lucide-react";
import type { ProfileCardPayload } from "@/lib/queries";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";

// Same plan config as ProfileCard
const PLAN_CONFIG = {
  BOOST: {
    wrapClass:  "ring-[3px] ring-orange-500",
    badgeBg:    "bg-orange-500",
    badgeText:  "text-white",
    badgeLabel: "BOOST",
    priceClass: "text-orange-500 font-bold",
  },
  PREMIUM: {
    wrapClass:  "ring-2 ring-coral",
    badgeBg:    "bg-coral",
    badgeText:  "text-white",
    badgeLabel: "PREMIUM",
    priceClass: "text-coral font-bold",
  },
  DESTAQUE: {
    wrapClass:  "ring-2 ring-foreground",
    badgeBg:    "bg-foreground",
    badgeText:  "text-white",
    badgeLabel: "PLUS",
    priceClass: "text-foreground font-semibold",
  },
  ESSENCIAL: {
    wrapClass:  "ring-1 ring-line",
    badgeBg:    "bg-line",
    badgeText:  "text-muted",
    badgeLabel: "BASIC",
    priceClass: "text-muted font-medium",
  },
} as const;

export function ProfileListRow({ profile, className }: { profile: ProfileCardPayload; className?: string }) {
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";

  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();
  const plan = isBoosted ? PLAN_CONFIG.BOOST : (PLAN_CONFIG[profile.planTier] ?? PLAN_CONFIG.ESSENCIAL);

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative flex bg-white transition hover:shadow-md overflow-hidden",
        plan.wrapClass,
        className,
      )}
    >
      {/* Photo */}
      <div className="relative h-28 w-20 shrink-0 bg-line sm:h-32 sm:w-24">
        <Image src={imageUrl} alt="" fill className="object-cover" sizes="96px" />
        {/* Plan / boost badge on photo */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-0.5 text-[9px] font-bold",
          plan.badgeBg, plan.badgeText,
        )}>
          {plan.badgeLabel}
        </div>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 p-3 sm:flex-row sm:items-center sm:p-4">
        <div>
          <p className="text-base font-semibold leading-tight">
            {profile.displayName}, {profile.age}
          </p>
          <p className="mt-0.5 text-[10px] text-muted/50">@{profile.slug}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            {profile.district.name} · {profile.city.name}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
            <Star className="h-3.5 w-3.5 fill-coral text-coral" strokeWidth={0} />
            <span className="font-medium text-foreground">{profile.ratingAvg.toFixed(1)}</span>
            <span>· {profile.ratingCount} av.</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {profile.isVerified && (
            <span className="hidden items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-success sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Verificada
            </span>
          )}
          <span className={cn("text-sm", plan.priceClass)}>
            {formatBrl(profile.priceHour)} /h
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-foreground" strokeWidth={1.5} />
        </div>
      </div>
    </Link>
  );
}

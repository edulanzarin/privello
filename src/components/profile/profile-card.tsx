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
    wrapClass: "ring-2 ring-[#ff9500]",
    badgeBg: "bg-[#ff9500]",
    badgeText: "text-white",
    badgeLabel: "BOOST",
    priceClass: "text-[#ff9500] font-semibold",
  },
  PREMIUM: {
    wrapClass: "ring-[1.5px] ring-coral",
    badgeBg: "bg-coral",
    badgeText: "text-white",
    badgeLabel: "PREMIUM",
    priceClass: "text-coral font-semibold",
  },
  DESTAQUE: {
    wrapClass: "ring-[1.5px] ring-foreground/30",
    badgeBg: "bg-foreground/85",
    badgeText: "text-white",
    badgeLabel: "PLUS",
    priceClass: "text-foreground font-semibold",
  },
  ESSENCIAL: {
    wrapClass: "ring-[0.5px] ring-black/[0.08]",
    badgeBg: "bg-black/50",
    badgeText: "text-white/90",
    badgeLabel: "BASIC",
    priceClass: "text-muted font-medium",
  },
} as const;

export function ProfileCard({ profile, className, storyRing = "none" }: ProfileCardProps) {
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > new Date();
  const plan = isBoosted ? PLAN_CONFIG.BOOST : (PLAN_CONFIG[profile.planTier] ?? PLAN_CONFIG.ESSENCIAL);
  const p = profile as typeof profile & { lastActiveAt?: Date | string | null };
  const isOnline = p.lastActiveAt != null &&
    (Date.now() - new Date(p.lastActiveAt).getTime()) < 5 * 60 * 1000;

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300",
        "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1",
        plan.wrapClass,
        className,
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/[0.03]">
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 50vw, 33vw"
        />

        {/* Gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top badges */}
        <div className="absolute inset-x-0 top-0 flex justify-between p-3">
          {profile.isVerified ? (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-[3px] text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
              <span className="h-[5px] w-[5px] rounded-full bg-success" />
              Verificada
            </span>
          ) : <span />}
          {isOnline ? (
            <span className="flex items-center gap-1 rounded-full bg-success px-2 py-[3px] text-[10px] font-semibold text-white shadow-sm">
              <span className="h-[5px] w-[5px] rounded-full bg-white" />
              Online
            </span>
          ) : <span />}
        </div>

        {/* Plan badge */}
        <div className={cn(
          "absolute inset-x-3 bottom-3 flex items-center justify-center rounded-full py-[5px] text-[10px] font-bold uppercase tracking-[0.12em]",
          plan.badgeBg, plan.badgeText,
        )}>
          {plan.badgeLabel}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight tracking-tight">
            {profile.displayName}, {profile.age}
          </p>
          {profile.tagline ? (
            <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-muted italic">
              &ldquo;{profile.tagline}&rdquo;
            </p>
          ) : (
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              {profile.district.name} · {profile.city.name}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.05] pt-2">
          <span className="flex items-center gap-1 text-[12px]">
            <Star className="h-3 w-3 fill-[#ff9500] text-[#ff9500]" strokeWidth={0} />
            <span className="font-semibold">{profile.ratingAvg.toFixed(1)}</span>
            <span className="text-muted">· {profile.ratingCount}</span>
          </span>
          <span className={cn("text-[13px]", plan.priceClass)}>
            {formatBrl(profile.priceHour)}<span className="text-[11px] font-normal text-muted">/h</span>
          </span>
        </div>
      </div>

      {/* Story ring */}
      {storyRing !== "none" && (
        <div className={cn(
          "absolute inset-0 pointer-events-none rounded-2xl",
          storyRing === "unseen" ? "ring-[3px] ring-coral/70" : "ring-2 ring-black/10",
        )} />
      )}
    </Link>
  );
}

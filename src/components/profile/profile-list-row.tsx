import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import type { ProfileCardPayload } from "@/lib/queries";
import { formatBrl } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ProfileListRow({ profile, className }: { profile: ProfileCardPayload; className?: string }) {
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";

  return (
    <Link
      href={`/p/${profile.slug}`}
      className={cn(
        "group flex gap-4 border border-line bg-white p-4 transition hover:border-foreground/20 hover:shadow-sm",
        className,
      )}
    >
      <div className="relative h-28 w-20 shrink-0 bg-line sm:h-32 sm:w-24">
        <Image src={imageUrl} alt="" fill className="object-cover" sizes="96px" />
        {profile.boostLabel ? (
          <span className="absolute inset-x-0 bottom-0 bg-coral py-0.5 text-center text-[9px] font-bold uppercase text-white">
            {profile.boostLabel}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="font-serif text-lg">
            {profile.displayName}, {profile.age}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
            {profile.district.name} · {profile.city.name}
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted">
            <Star className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
            <span className="font-medium text-foreground">{profile.ratingAvg.toFixed(1)}</span>
            <span className="text-xs">· {profile.ratingCount} avaliações</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="font-semibold text-coral">{formatBrl(profile.priceHour)} /h</span>
          <ArrowUpRight className="h-5 w-5 text-muted group-hover:text-foreground" strokeWidth={1.25} />
        </div>
      </div>
    </Link>
  );
}

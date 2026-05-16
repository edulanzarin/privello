"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Star } from "lucide-react";
import { formatBrl } from "@/lib/money";

type Favorite = {
  profile: {
    id: string;
    slug: string;
    displayName: string;
    age: number;
    priceHour: number;
    ratingAvg: number;
    ratingCount: number;
    district: { name: string } | null;
    city: { name: string };
    media: { url: string }[];
  };
  createdAt: string;
};

const PAGE_SIZE = 8;

export function FavoritesList({ favorites }: { favorites: Favorite[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = favorites.slice(0, visibleCount);
  const remaining = favorites.length - visibleCount;

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-14 text-center shadow-sm">
        <Heart className="mx-auto h-10 w-10 text-muted" strokeWidth={1} />
        <p className="mt-4 text-[17px] font-semibold">Nenhum perfil curtido ainda.</p>
        <p className="mt-2 text-[14px] text-muted">
          Explore acompanhantes e curta os perfis que te interessam.
        </p>
        <Link
          href="/buscar"
          className="mt-6 inline-block rounded-full bg-coral px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
        >
          Explorar perfis
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map(({ profile, createdAt }) => {
          const cover = profile.media[0];
          const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
          return (
            <Link
              key={profile.id}
              href={`/p/${profile.slug}`}
              className="group overflow-hidden rounded-2xl bg-white border border-black/[0.06] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/[0.03]">
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width:640px) 50vw, 25vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>
              <div className="p-3">
                <p className="text-[13px] font-semibold leading-tight truncate">
                  {profile.displayName}, {profile.age}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted truncate">
                  <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                  {profile.city.name}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-0.5 text-[11px]">
                    <Star className="h-3 w-3 fill-[#ff9500] text-[#ff9500]" strokeWidth={0} />
                    <span className="font-medium">{profile.ratingAvg.toFixed(1)}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-coral">
                    {formatBrl(profile.priceHour)}/h
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full rounded-xl border border-black/10 bg-white py-3 text-[13px] font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.99]"
        >
          Ver mais · {remaining} restante{remaining !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

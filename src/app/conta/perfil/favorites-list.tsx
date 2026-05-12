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
    district: { name: string };
    city: { name: string };
    media: { url: string }[];
  };
  createdAt: string;
};

const PAGE_SIZE = 6;

export function FavoritesList({ favorites }: { favorites: Favorite[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = favorites.slice(0, visibleCount);
  const remaining = favorites.length - visibleCount;

  if (favorites.length === 0) {
    return (
      <div className="border border-line bg-white px-6 py-14 text-center">
        <Heart className="mx-auto h-10 w-10 text-muted" strokeWidth={1} />
        <p className="mt-4 text-lg font-semibold">Nenhum perfil curtido ainda.</p>
        <p className="mt-2 text-sm text-muted">
          Explore acompanhantes e curta os perfis que te interessam.
        </p>
        <Link
          href="/descobrir/sao-paulo-sp"
          className="mt-6 inline-block bg-coral px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
        >
          Explorar perfis
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map(({ profile, createdAt }) => {
          const cover = profile.media[0];
          const imageUrl = cover?.url ?? "https://picsum.photos/seed/empty/480/720";
          return (
            <Link
              key={profile.id}
              href={`/p/${profile.slug}`}
              className="group flex gap-4 border border-line bg-white p-4 transition hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-line">
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold leading-tight">
                    {profile.displayName}, {profile.age}
                  </p>
                  <p className="shrink-0 text-sm font-bold text-coral">
                    {formatBrl(profile.priceHour)}/h
                  </p>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                  {profile.district.name} · {profile.city.name}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <Star className="h-3 w-3 fill-coral text-coral" strokeWidth={0} />
                    {profile.ratingAvg.toFixed(1)} · {profile.ratingCount} av.
                  </p>
                  <p className="text-[10px] text-muted">
                    {new Date(createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full border border-line bg-white py-3 text-xs font-semibold uppercase tracking-wider text-muted transition hover:border-foreground/30 hover:text-foreground"
        >
          Ver mais · {remaining} restante{remaining !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

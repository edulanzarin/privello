"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PriceTag } from "@/components/ui/price-tag";
import { RatingStars } from "@/components/ui/rating-stars";
import { Button } from "@/components/ui/button";

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

/**
 * FavoritesList — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/conta/perfil/favorites-list.tsx
 * Steering: `.kiro/steering/design-system.md` §5.2 (grid), §6.
 *
 * Grid de perfis curtidos pelo cliente (variação compacta do ProfileCard).
 * Não consome `<ProfileCard>` direto porque o data shape do favorito é
 * mínimo (`Favorite` aqui) e ProfileCard exige `ProfileCardPayload` com
 * mídia/audio/booleans completos. Reusa primitivos `<PriceTag>` e
 * `<RatingStars>` para manter consistência visual.
 *
 * Variant: 4 colunas em desktop, 3 em tablet, 2 em mobile.
 *
 * Side effects:
 *  - Estado local de paginação (`visibleCount`).
 *
 * Consumidores:
 *  - src/app/conta/perfil/page.tsx
 */
export function FavoritesList({ favorites }: { favorites: Favorite[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = favorites.slice(0, visibleCount);
  const remaining = favorites.length - visibleCount;

  if (favorites.length === 0) {
    return (
      <EmptyState
        title="Nenhum perfil curtido ainda"
        description="Explore acompanhantes e curta os perfis que te interessam."
        icon={<Heart className="h-10 w-10" strokeWidth={1.5} />}
        action={{ label: "Explorar perfis", href: "/descobrir" }}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map(({ profile }) => {
          const cover = profile.media[0];
          const imageUrl =
            cover?.url ?? "https://picsum.photos/seed/empty/480/720";
          return (
            <Link
              key={profile.id}
              href={`/p/${profile.slug}`}
              className="group overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-sm)] transition-all duration-200 ease-[var(--ease-tahoe)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-line">
                <Image
                  src={imageUrl}
                  alt={profile.displayName}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width:640px) 50vw, 25vw"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent"
                  aria-hidden
                />
              </div>
              <div className="p-3">
                <p className="truncate text-base font-semibold leading-tight text-ink">
                  {profile.displayName}
                  <span className="ml-1 text-sm font-medium text-ink-dim">
                    {profile.age}
                  </span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-dim">
                  <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={2} />
                  {profile.city.name}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  {profile.ratingCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs">
                      <RatingStars value={profile.ratingAvg} size="xs" />
                      <span className="font-semibold tabular-nums text-ink">
                        {profile.ratingAvg.toFixed(1)}
                      </span>
                    </span>
                  ) : (
                    <span />
                  )}
                  <PriceTag
                    value={profile.priceHour}
                    variant="inline"
                    period="hora"
                    periodFormat="short"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {remaining > 0 && (
        <Button
          variant="outline"
          size="md"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full"
        >
          Ver mais · {remaining} restante{remaining !== 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}

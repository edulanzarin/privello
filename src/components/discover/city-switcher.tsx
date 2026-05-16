"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";

type Props = { currentCityName: string; citySlug: string };

function displayFromSlug(slug: string, fallback: string): string {
  const parts = slug.split("-");
  if (parts.length < 2) return fallback;
  const uf = parts[parts.length - 1].toUpperCase();
  if (fallback.includes(",")) return fallback;
  return `${fallback}, ${uf}`;
}

export function CitySwitcher({ currentCityName, citySlug }: Props) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);

  const displayName = displayFromSlug(citySlug, currentCityName);

  return (
    <div className="sticky top-11 z-40 border-b border-black/[0.06] bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2 py-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-coral" strokeWidth={2} />
          <span className="text-xs font-medium text-muted whitespace-nowrap">
            Cidade:
          </span>

          {searching ? (
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <div className="flex-1 min-w-0">
                <CityAutocomplete
                  initialLabel=""
                  onSelect={(slug) => {
                    sessionStorage.setItem(LAST_CITY_KEY, slug);
                    setSearching(false);
                    router.push(`/descobrir/${slug}`);
                  }}
                  compact
                />
              </div>
              <button
                onClick={() => setSearching(false)}
                className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground"
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <button
                onClick={() => setSearching(true)}
                className="flex items-center gap-1 text-base font-semibold text-foreground transition-colors hover:text-coral"
              >
                {displayName}
                <ChevronDown className="h-3 w-3 text-muted" strokeWidth={2} />
              </button>
              <Link
                href="/buscar"
                className="ml-1 rounded-full p-1 text-muted transition-colors hover:bg-black/[0.04] hover:text-foreground"
                title="Limpar cidade"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

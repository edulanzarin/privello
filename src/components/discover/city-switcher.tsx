"use client";

import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";

type Props = { currentCityName: string };

export function CitySwitcher({ currentCityName }: Props) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);

  return (
    <div className="sticky top-14 z-40 border-b border-line bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2 py-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-coral" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted whitespace-nowrap">
            Cidade:
          </span>

          {searching ? (
            /* Autocomplete mode */
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <div className="flex-1 min-w-0">
                <CityAutocomplete
                  initialLabel=""
                  onSelect={(slug, label) => {
                    sessionStorage.setItem(LAST_CITY_KEY, slug);
                    setSearching(false);
                    router.push(`/descobrir/${slug}`);
                  }}
                  compact
                />
              </div>
              <button
                onClick={() => setSearching(false)}
                className="shrink-0 p-1 text-muted hover:text-foreground"
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            /* Static display mode */
            <button
              onClick={() => setSearching(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-coral transition"
            >
              {currentCityName}
              <ChevronDown className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

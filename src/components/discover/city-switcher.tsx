"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";

type Props = { currentCityName: string };

export function CitySwitcher({ currentCityName }: Props) {
  const router = useRouter();

  return (
    <div className="sticky top-14 z-40 border-b border-line bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2 py-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-coral" strokeWidth={2} />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
            Cidade:
          </span>
          {/* Autocomplete inline — compact */}
          <div className="flex-1 min-w-0">
            <CityAutocomplete
              initialLabel={currentCityName}
              onSelect={(slug, label) => {
                sessionStorage.setItem(LAST_CITY_KEY, slug);
                router.push(`/descobrir/${slug}`);
              }}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

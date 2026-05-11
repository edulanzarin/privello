"use client";

import { useEffect } from "react";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";

/**
 * Invisible component — saves the current citySlug to sessionStorage
 * so the bottom nav "Acompanhantes" tab can restore it on next tap.
 */
export function CitySessionSaver({ citySlug }: { citySlug: string }) {
  useEffect(() => {
    if (citySlug) sessionStorage.setItem(LAST_CITY_KEY, citySlug);
  }, [citySlug]);

  return null;
}

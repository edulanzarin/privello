"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { REELS_CITY_KEY } from "./city-filter";

export function ReelsCityRestorer() {
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem(REELS_CITY_KEY);
    if (saved) router.replace(`/reels?cidade=${saved}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { trackProfileView } from "@/app/_actions/track-view";

/**
 * Invisible component — fires a view count increment once per mount.
 * Placed in the profile page so it runs for every visitor (logged in or not).
 */
export function ViewTracker({ profileId }: { profileId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Fire-and-forget — don't await, don't block render
    trackProfileView(profileId).catch(() => {});
  }, [profileId]);

  return null;
}

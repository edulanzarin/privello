"use client";

import { useEffect, useRef } from "react";
import { trackProfileView } from "@/app/_actions/track-view";

/**
 * Componente "fantasma" sem JSX visível que dispara `trackProfileView(profileId)`
 * uma única vez por mount. Inserido na página de perfil público para registrar
 * a visita de qualquer visitante (logado ou não).
 *
 * Props:
 * - `profileId` (string): id do perfil cuja contagem de visualizações será incrementada.
 *
 * Consumidores conhecidos:
 * - src/app/p/[slug]/page.tsx
 *
 * Side effects:
 * - Server action `trackProfileView(profileId)` em `src/app/_actions/track-view.ts` (fire-and-forget).
 * - `useRef` `fired` impede dupla execução em React Strict Mode (dev).
 */
export function ViewTracker({ profileId }: { profileId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Fire-and-forget — don't await, don't block render
    trackProfileView(profileId).catch(() => { });
  }, [profileId]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { REELS_CITY_KEY } from "./city-filter";

/**
 * Componente "fantasma" que restaura o filtro de cidade do feed de Reels:
 * lê `REELS_CITY_KEY` do sessionStorage no mount e, se houver valor, faz
 * `router.replace("/reels?cidade=<slug>")`.
 *
 * Renderizado apenas quando a rota não veio com `?cidade=...` (ver consumer).
 *
 * Consumidores conhecidos:
 * - src/app/reels/page.tsx
 *
 * Side effects:
 * - `sessionStorage.getItem(REELS_CITY_KEY)` no mount.
 * - `router.replace(...)` para navegação client-side sem entrada nova no histórico.
 */
export function ReelsCityRestorer() {
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem(REELS_CITY_KEY);
    if (saved) router.replace(`/reels?cidade=${saved}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

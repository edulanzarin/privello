"use client";

import { useEffect } from "react";
import { LAST_CITY_KEY } from "@/components/layout/bottom-nav";

/**
 * Componente "fantasma" sem JSX visível que persiste o `citySlug` atual em
 * `sessionStorage` sob a chave `LAST_CITY_KEY` (ver bottom-nav). A aba
 * "Acompanhantes" do bottom-nav usa essa chave para restaurar a última cidade
 * vista quando o usuário navega de volta.
 *
 * Props:
 * - `citySlug` (string): slug da cidade da rota atual (`/descobrir/[citySlug]`).
 *
 * Consumidores conhecidos:
 * - src/app/descobrir/[citySlug]/page.tsx
 *
 * Side effects:
 * - `sessionStorage.setItem(LAST_CITY_KEY, citySlug)` no mount/update de `citySlug`.
 */
export function CitySessionSaver({ citySlug }: { citySlug: string }) {
  useEffect(() => {
    if (citySlug) sessionStorage.setItem(LAST_CITY_KEY, citySlug);
  }, [citySlug]);

  return null;
}

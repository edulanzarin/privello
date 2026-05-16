/**
 * Helpers utilitários gerais (UI/Tailwind)
 *
 * Caminho: src/lib/utils.ts
 *
 * Reúne helpers pequenos, sem dependência de domínio nem I/O. Hoje contém
 * apenas o `cn`, usado em todo o design system para combinar `className`s
 * condicionais e resolver conflitos de classes Tailwind (ex.: `px-2 px-4`).
 *
 * Convenções:
 * - Pure functions, sem side effects.
 * - Não importa Prisma, não acessa rede, não acessa DOM.
 * - Pode ser usado em RSC e Client Components indistintamente.
 *
 * Cross-refs:
 * - src/components/ui/* (consumidores principais: button, input, modal,
 *   dropdown, badge, card, switch, toggle-chip, etc.)
 * - https://github.com/dcastil/tailwind-merge — comportamento do `twMerge`.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais com `clsx` e resolve conflitos de utilitários
 * Tailwind com `twMerge` (a última classe vence — ex.: `cn("p-2", "p-4")`
 * resolve para `"p-4"`).
 *
 * @param inputs - Lista de `ClassValue` (strings, arrays, objetos
 *   `{ classe: boolean }` ou valores falsy ignorados).
 * @returns `string` única, deduplicada, pronta para `className`.
 *
 * @example
 * cn("px-2", isActive && "bg-coral", "px-4");
 * // => "bg-coral px-4"  (px-2 sobrescrito por px-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

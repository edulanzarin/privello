"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DiscoverViewToggle — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/discover/discover-view-toggle.tsx
 * Steering: `.kiro/steering/design-system.md` §3.6 (glass) + §13.3.
 *
 * Toggle "grade ↔ lista" no header sticky de Descobrir.
 * Container glass-pill com 2 botões circulares. Ativo em `bg-rose-soft text-rose`.
 * Touch target ≥ 44×44.
 *
 * Side effects:
 *  - `useSearchParams()` para preservar o restante da query string.
 */
export function DiscoverViewToggle({ citySlug }: { citySlug: string }) {
  const base = `/descobrir/${citySlug}`;
  const sp = useSearchParams();
  const view = sp.get("view") === "list" ? "list" : "grid";

  const buildHref = (next: "grid" | "list") => {
    const p = new URLSearchParams(sp.toString());
    if (next === "grid") p.delete("view");
    else p.set("view", "list");
    const q = p.toString();
    return q ? `${base}?${q}` : base;
  };

  return (
    <div className="glass-pill flex shrink-0 items-center gap-0.5 p-1">
      <Link
        href={buildHref("grid")}
        aria-label="Visualizar em grade"
        aria-current={view === "grid" ? "page" : undefined}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150 ease-[var(--ease-tahoe)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          view === "grid"
            ? "bg-rose-soft text-rose"
            : "text-ink-dim hover:text-ink hover:bg-line/40",
        )}
      >
        <Grid3X3 className="h-4 w-4" strokeWidth={view === "grid" ? 2 : 1.6} />
      </Link>
      <Link
        href={buildHref("list")}
        aria-label="Visualizar em lista"
        aria-current={view === "list" ? "page" : undefined}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150 ease-[var(--ease-tahoe)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          view === "list"
            ? "bg-rose-soft text-rose"
            : "text-ink-dim hover:text-ink hover:bg-line/40",
        )}
      >
        <List className="h-4 w-4" strokeWidth={view === "list" ? 2 : 1.6} />
      </Link>
    </div>
  );
}

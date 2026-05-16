"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggle "grade ↔ lista" da página `/descobrir/[citySlug]`. Renderiza dois
 * `<Link>` com `?view=grid|list` mantendo os outros search params intactos.
 *
 * Props:
 * - `citySlug` (string): slug da cidade atual usado como base do `href`.
 *
 * Consumidores conhecidos:
 * - src/app/descobrir/[citySlug]/page.tsx
 *
 * Side effects:
 * - `useSearchParams()` para ler/preservar o restante da query string.
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
    <div className="flex items-center gap-1 border border-line bg-white p-1">
      <Link
        href={buildHref("grid")}
        className={cn(
          "rounded p-2 text-muted transition hover:text-foreground",
          view === "grid" && "bg-foreground text-white hover:text-white",
        )}
        aria-label="Grade"
      >
        <Grid3X3 className="h-4 w-4" strokeWidth={1.5} />
      </Link>
      <Link
        href={buildHref("list")}
        className={cn(
          "rounded p-2 text-muted transition hover:text-foreground",
          view === "list" && "bg-foreground text-white hover:text-white",
        )}
        aria-label="Lista"
      >
        <List className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}

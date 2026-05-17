"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ProfileCard } from "@/components/profile/profile-card";
import type { ProfileCardPayload } from "@/lib/services";
import { cn } from "@/lib/utils";

type Props = {
  type: "hot" | "boosted";
  initialProfiles: ProfileCardPayload[];
  initialHasMore: boolean;
  viewAllHref: string;
};

/**
 * ProfileSection — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/home/profile-section.tsx
 * Steering: `.kiro/steering/design-system.md` §5.2 (grid de listagem).
 *
 * Grid 3-col desktop / 2-col tablet / 1-col mobile (decisão B1).
 * Aspect 3:4 fixo via ProfileCard. Gap 5 (20px) entre cards.
 *
 * "Ver mais" (paginação cliente) usa Button-like glass; "Ver todas →"
 * com seta e cor rose pra dar discovery hint.
 *
 * Side effects:
 *  - `fetch("/api/profiles/section?type=...&offset=...")` no clique de "Ver mais".
 */
export function ProfileSection({ type, initialProfiles, initialHasMore, viewAllHref }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/section?type=${type}&offset=${profiles.length}`);
      const data = await res.json();
      setProfiles((prev) => [...prev, ...data.profiles]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loading}
            className={cn(
              "rounded-full border border-line bg-white/55 px-5 py-2.5 text-base font-medium text-ink",
              "backdrop-blur-md backdrop-saturate-150",
              "transition-all duration-150 ease-[var(--ease-tahoe)]",
              "hover:bg-white/75 hover:border-ink/15",
              "active:scale-[0.97]",
              "disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {loading ? "Carregando…" : "Ver mais"}
          </button>
        ) : (
          <span />
        )}

        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 text-base font-medium text-rose hover:text-plum transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </div>
    </>
  );
}

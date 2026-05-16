"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfileCard } from "@/components/profile/profile-card";
import type { ProfileCardPayload } from "@/lib/queries";

type Props = {
  type: "hot" | "boosted";
  initialProfiles: ProfileCardPayload[];
  initialHasMore: boolean;
  viewAllHref: string;
};

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
      <div className="mx-auto mt-10 max-w-6xl columns-1 gap-6 px-4 sm:columns-2 sm:px-6 lg:columns-4 [&>*]:mb-6 [&>*]:break-inside-avoid">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl items-center justify-between px-4 sm:px-6">
        <div>
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-sm font-semibold text-foreground underline-offset-2 hover:underline disabled:opacity-50"
            >
              {loading ? "Carregando…" : "Ver mais →"}
            </button>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-semibold text-foreground hover:text-coral transition"
        >
          Ver todas →
        </Link>
      </div>
    </>
  );
}

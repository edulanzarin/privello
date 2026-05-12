"use client";

import { useRouter } from "next/navigation";

type City = { id: string; name: string; slug: string };

export function ReelsCityFilter({ cities, currentSlug }: { cities: City[]; currentSlug?: string }) {
  const router = useRouter();

  return (
    <select
      value={currentSlug ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        router.push(val ? `/reels?cidade=${val}` : "/reels");
      }}
      className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm focus:outline-none"
    >
      <option value="">Todas as cidades</option>
      {cities.map((c) => (
        <option key={c.id} value={c.slug}>{c.name}</option>
      ))}
    </select>
  );
}

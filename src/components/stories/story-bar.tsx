"use client";

import { useEffect, useState } from "react";
import { StoryCircle } from "@/components/ui/story-circle";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryGroup } from "@/lib/services";

/**
 * StoryBar — barra horizontal de stories (Descobrir).
 *
 * Caminho: src/components/stories/story-bar.tsx
 * Steering: `.kiro/steering/design-system.md` §15.
 *
 * Composição (v2 Tahoe Sensual):
 *  - Lista de `<StoryCircle size="md">` numa row scroll-x.
 *  - Ao clicar abre `<StoryViewer>` (modal compartilhado).
 *
 * A v1 desta arquivo continha 350 linhas com toda a lógica de viewer
 * (progress bar, like, view tracking, teclado). Tudo isso foi extraído pra
 * `story-viewer.tsx` e agora StoryBar é só um wrapper de orquestração.
 *
 * Props:
 *  - `groups`: grupos retornados por `listStoriesForCity`.
 *  - `isClient`: usuário logado (libera curtir + view tracking server-side).
 *
 * Touch-target compliance: o close + like ≥ 44×44 vivem em
 * `story-viewer.tsx` (referenciado por `touch-target.pbt.ts`).
 */
export function StoryBar({
  groups,
  isClient,
}: {
  groups: StoryGroup[];
  isClient: boolean;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [localGroups, setLocalGroups] = useState<StoryGroup[]>(groups);

  // Restaura status de "vistos" do sessionStorage ao montar.
  useEffect(() => {
    try {
      const seen = new Set<string>(
        JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"),
      );
      if (!seen.size) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time browser API
      setLocalGroups((prev) =>
        prev.map((g) => {
          const stories = g.stories.map((s) =>
            seen.has(s.id) ? { ...s, seenByMe: true } : s,
          );
          return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
        }),
      );
    } catch {
      /* ignore */
    }
  }, []);

  if (localGroups.length === 0) return null;

  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-5 overflow-x-auto py-4 scrollbar-hide">
            {localGroups.map((group, gi) => (
              <StoryCircle
                key={group.profileId}
                imageUrl={group.coverUrl}
                displayName={group.displayName}
                seen={group.allSeen}
                size="md"
                onClick={() => setOpenIdx(gi)}
              />
            ))}
          </div>
        </div>
      </div>

      {openIdx !== null && (
        <StoryViewer
          groups={localGroups}
          initialGroupIdx={openIdx}
          onClose={() => setOpenIdx(null)}
          onChange={setLocalGroups}
          isClient={isClient}
        />
      )}
    </>
  );
}

"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryViewer } from "@/components/stories/story-viewer";
import type { StoryGroup } from "@/lib/services";

/**
 * ProfileStoryCover — capa redonda XL do perfil público com indicador de stories.
 *
 * Caminho: src/components/profile/profile-story-cover.tsx
 * Steering: `.kiro/steering/design-system.md` §15.
 *
 * Composição (v2 Tahoe Sensual):
 *  - Capa 160/192 redonda com ring gradiente (rose → peach → plum) quando
 *    há stories não vistos. Hairline + opacity quando todos vistos.
 *  - Pílula contadora `Play + N` no rodapé (rose quando não-visto, ink/40 se seen).
 *  - Click abre `<StoryViewer>` (modal compartilhado).
 *
 * Diferente do StoryBar, este componente:
 *  - Tem só 1 grupo (do perfil corrente).
 *  - Usa estilo "cover photo" em vez de circle de listagem (não usamos
 *    `<StoryCircle xl>` aqui porque a foto é também a capa do perfil
 *    sem stories — gradiente custom é condicional).
 *
 * Props:
 *  - `storyGroup`: grupo de stories do perfil ou null.
 *  - `coverUrl`: URL da foto de capa (placeholder "Sem foto" se null).
 *  - `displayName`: nome (alt + viewer header).
 *  - `isClient`: libera curtir + view tracking server-side.
 *  - `planBadge`: legado mantido por compat — atualmente não consumido visualmente.
 */
export function ProfileStoryCover({
  storyGroup,
  coverUrl,
  displayName,
  isClient,
}: {
  storyGroup: StoryGroup | null;
  coverUrl: string | null;
  displayName: string;
  /** Mantido por compat com `app/p/[slug]/page.tsx`; não consumido visualmente. */
  planBadge?: { bg: string; label: string };
  isClient: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [localGroup, setLocalGroup] = useState<StoryGroup | null>(storyGroup);

  // Sync vistos do sessionStorage no mount.
  useEffect(() => {
    if (!localGroup) return;
    try {
      const seen = new Set<string>(
        JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"),
      );
      if (!seen.size) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser API → state sync
      setLocalGroup((g) => {
        if (!g) return g;
        const stories = g.stories.map((s) =>
          seen.has(s.id) ? { ...s, seenByMe: true } : s,
        );
        return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
      });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasStory = !!localGroup?.stories.length;
  const allSeen = localGroup?.allSeen ?? false;

  return (
    <>
      <button
        type="button"
        disabled={!hasStory}
        onClick={() => setOpen(true)}
        className={cn(
          "group relative mx-auto block h-40 w-40 overflow-hidden rounded-full bg-line sm:h-48 sm:w-48",
          "shadow-[var(--shadow-md)]",
          "transition-transform duration-200 ease-[var(--ease-tahoe)]",
          hasStory && "cursor-pointer hover:scale-[1.02] active:scale-[0.99]",
          !hasStory && "cursor-default",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Ring de status quando há story
          hasStory &&
          !allSeen &&
          "ring-[3px] ring-rose ring-offset-2 ring-offset-white",
          hasStory &&
          allSeen &&
          "ring-[2px] ring-line ring-offset-2 ring-offset-white",
        )}
        aria-label={
          hasStory
            ? `Ver stories de ${displayName} (${localGroup?.stories.length})`
            : `Foto de ${displayName}`
        }
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={displayName}
            fill
            className={cn(
              "object-cover",
              hasStory && allSeen && "opacity-90",
            )}
            sizes="(min-width: 640px) 192px, 160px"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink/[0.04]">
            <p className="text-base text-ink-dim">Sem foto</p>
          </div>
        )}

        {hasStory && (
          <span
            className={cn(
              "pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-bold text-white backdrop-blur-sm",
              !allSeen ? "bg-rose shadow-[var(--shadow-sm)]" : "bg-ink/40",
            )}
          >
            <Play className="h-2 w-2 fill-white" strokeWidth={0} />
            <span className="tabular-nums">{localGroup?.stories.length}</span>
          </span>
        )}
      </button>

      {open && localGroup && (
        <StoryViewer
          groups={[localGroup]}
          initialGroupIdx={0}
          onClose={() => setOpen(false)}
          onChange={(gs) => setLocalGroup(gs[0] ?? null)}
          isClient={isClient}
        />
      )}
    </>
  );
}

"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, X, Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryGroup } from "@/lib/queries";

const DURATION = 5000;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  return "há 1 dia";
}

export function ProfileStoryCover({
  storyGroup,
  coverUrl,
  displayName,
  planBadge,
  isClient,
}: {
  storyGroup: StoryGroup | null;
  coverUrl: string | null;
  displayName: string;
  planBadge: { bg: string; label: string };
  isClient: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [localGroup, setLocalGroup] = useState(storyGroup);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  // Keep next/stopTimers in refs so progress effect deps stay stable
  const nextRef = useRef<() => void>(() => {});
  const stopTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const hasStory = !!localGroup?.stories.length;
  const allSeen = localGroup?.allSeen ?? false;
  const activeStory = localGroup?.stories[idx] ?? null;

  const close = useCallback(() => {
    setOpen(false);
    setIdx(0);
    setProgress(0);
    stopTimers();
  }, [stopTimers]);

  const next = useCallback(() => {
    if (!localGroup) return;
    if (idx < localGroup.stories.length - 1) {
      setIdx((i) => i + 1);
    } else {
      close();
    }
  }, [localGroup, idx, close]);

  // Keep nextRef current so the RAF timer can call it without being a dep
  useEffect(() => { nextRef.current = next; }, [next]);

  const prev = useCallback(() => {
    if (idx > 0) setIdx((i) => i - 1);
  }, [idx]);

  // Restore seen state from sessionStorage on mount
  useEffect(() => {
    try {
      const seen = new Set<string>(JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"));
      if (!seen.size || !localGroup) return;
      setLocalGroup((g) => {
        if (!g) return g;
        const stories = g.stories.map((s) => seen.has(s.id) ? { ...s, seenByMe: true } : s);
        return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
      });
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress + auto-advance — only re-run when open or idx changes, not on localGroup updates
  useEffect(() => {
    if (!open) return;
    stopTimers();
    setProgress(0);
    startRef.current = Date.now();
    function tick() {
      const pct = Math.min(((Date.now() - startRef.current) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => nextRef.current(), DURATION);
    return stopTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]); // intentionally omit next/stopTimers — using refs instead

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, close, next, prev]);

  // Mark as seen — use idx as dep, not activeStory object
  useEffect(() => {
    if (!open || !activeStory) return;
    try {
      const seen = new Set<string>(JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"));
      seen.add(activeStory.id);
      sessionStorage.setItem("prv_seen", JSON.stringify([...seen]));
    } catch { /* ignore */ }
    const storyId = activeStory.id;
    setLocalGroup((g) => {
      if (!g) return g;
      const stories = g.stories.map((s) => s.id === storyId ? { ...s, seenByMe: true } : s);
      return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
    });
    if (isClient) {
      fetch("/api/stories/view", {
        method: "POST",
        body: JSON.stringify({ storyId }),
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]); // intentionally omit activeStory object — use idx instead

  async function toggleLike() {
    if (!isClient || !activeStory) return;
    const liked = !activeStory.likedByMe;
    const storyId = activeStory.id;
    await fetch("/api/stories/like", {
      method: "POST",
      body: JSON.stringify({ storyId, liked }),
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    setLocalGroup((g) => {
      if (!g) return g;
      const stories = g.stories.map((s, si) =>
        si !== idx ? s : { ...s, likedByMe: liked, likeCount: liked ? s.likeCount + 1 : s.likeCount - 1 },
      );
      return { ...g, stories };
    });
  }

  return (
    <>
      {/* ── Cover photo ── */}
      <div className="relative flex flex-col items-center">
        {/* Gradient ring wrapper */}
        <div
          className={cn(
            "relative w-full overflow-hidden lg:aspect-[3/4]",
            hasStory && !allSeen && "p-[3px]",
            hasStory && !allSeen && "bg-gradient-to-br from-coral via-orange-400 to-pink-500",
            hasStory && allSeen && "p-[2px] bg-line/50",
          )}
          onClick={() => hasStory && setOpen(true)}
          style={{ cursor: hasStory ? "pointer" : "default" }}
        >
          <div className="relative h-full w-full overflow-hidden bg-line">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 400px"
                priority
              />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center bg-line">
                <p className="text-sm text-muted">Sem foto</p>
              </div>
            )}

            {/* Plan badge */}
            <div className={cn("absolute inset-x-0 bottom-0 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white", planBadge.bg)}>
              {planBadge.label}
            </div>
          </div>
        </div>

        {/* Story ring avatar — visible below the cover, centered */}
        {hasStory && (
          <button
            onClick={() => setOpen(true)}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10"
          >
            <div className={cn(
              "rounded-full p-[3px]",
              !allSeen
                ? "bg-gradient-to-br from-coral via-orange-400 to-pink-500"
                : "bg-line/60",
            )}>
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-line">
                {coverUrl ? (
                  <Image src={coverUrl} alt={displayName} fill className="object-cover" sizes="48px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-foreground/50">
                    {displayName[0]}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-3.5 w-3.5 fill-white text-white" strokeWidth={0} />
                </div>
              </div>
            </div>
            <p className={cn(
              "mt-1 text-center text-[10px] font-bold uppercase tracking-wider",
              !allSeen ? "text-coral" : "text-muted",
            )}>
              Stories
            </p>
          </button>
        )}
      </div>

      {/* ── Story viewer overlay ── */}
      {open && localGroup && activeStory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden sm:h-[90vh] sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bars */}
            <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2 pt-3">
              {localGroup.stories.map((s, si) => (
                <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full rounded-full bg-white transition-none"
                    style={{ width: si < idx ? "100%" : si === idx ? `${progress}%` : "0%" }}
                  />
                </div>
              ))}
            </div>

            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-3 pb-2 pt-8">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20">
                <Image src={localGroup.coverUrl} alt={localGroup.displayName} fill className="object-cover" sizes="32px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{localGroup.displayName}</p>
                <p className="text-[10px] text-white/60">{timeAgo(activeStory.createdAt)}</p>
              </div>
              <button onClick={close} className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Story media */}
            <div className="relative flex-1 bg-black">
              <Image src={activeStory.mediaUrl} alt="" fill className="object-contain" sizes="480px" />
              {activeStory.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 px-4 pb-16 pt-8">
                  <p className="text-center text-sm leading-snug text-white">{activeStory.caption}</p>
                </div>
              )}
            </div>

            {/* Tap zones */}
            <div className="absolute inset-0 z-20 grid grid-cols-2">
              <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); prev(); }} />
              <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); next(); }} />
            </div>

            {/* Bottom bar */}
            <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between px-4 py-4 pointer-events-none">
              <span className="flex items-center gap-1 text-[11px] text-white/60 pointer-events-none">
                <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                {activeStory.viewCount}
              </span>
              <button
                className="pointer-events-auto flex items-center gap-1.5 text-[11px] text-white/80 hover:text-white"
                onClick={(e) => { e.stopPropagation(); toggleLike(); }}
              >
                <Heart className={cn("h-3.5 w-3.5", activeStory.likedByMe && "fill-coral text-coral")} strokeWidth={1.5} />
                {activeStory.likeCount}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

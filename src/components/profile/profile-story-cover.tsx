"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [localGroup, setLocalGroup] = useState(storyGroup);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
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

  useEffect(() => { nextRef.current = next; }, [next]);

  const prev = useCallback(() => {
    if (idx > 0) setIdx((i) => i - 1);
  }, [idx]);

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
  }, [open, idx]);

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
  }, [open, idx]);

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
      <div
        className={cn(
          "relative w-full aspect-[3/4] overflow-hidden bg-line",
          hasStory && "cursor-pointer",
        )}
        onClick={() => hasStory && setOpen(true)}
      >
        {/* Story ring — top gradient border effect via inset ring */}
        {hasStory && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10",
              !allSeen
                ? "ring-[3px] ring-inset ring-transparent"
                : "ring-[2px] ring-inset ring-white/20",
            )}
          />
        )}
        {hasStory && !allSeen && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-none"
            style={{ boxShadow: "inset 0 0 0 3px transparent, inset 0 0 0 3px #c8102e" }}
          />
        )}

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

        {/* Subtle dark gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Story pill indicator — bottom left */}
        {hasStory && (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className={cn(
              "absolute bottom-10 left-3 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:scale-105",
              !allSeen
                ? "bg-coral shadow-lg shadow-coral/30"
                : "bg-white/20 border border-white/30",
            )}
          >
            <Play className="h-2.5 w-2.5 fill-white" strokeWidth={0} />
            {localGroup ? `${localGroup.stories.length} ${localGroup.stories.length === 1 ? "story" : "stories"}` : "Stories"}
          </button>
        )}

        {/* Plan badge */}
        <div className={cn("absolute inset-x-0 bottom-0 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white z-20", planBadge.bg)}>
          {planBadge.label}
        </div>
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
              {isClient ? (
                <button
                  className="pointer-events-auto flex items-center gap-1.5 text-[11px] text-white/80 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); toggleLike(); }}
                >
                  <Heart className={cn("h-3.5 w-3.5", activeStory.likedByMe && "fill-coral text-coral")} strokeWidth={1.5} />
                  {activeStory.likeCount}
                </button>
              ) : (
                <Link
                  href={`/entrar?callbackUrl=${encodeURIComponent(pathname)}`}
                  className="pointer-events-auto text-[10px] text-white/50 hover:text-white/80 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  Entre para curtir
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

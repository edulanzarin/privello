"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Heart, X, Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
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
  const nextRef = useRef<() => void>(() => { });
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
      }).catch(() => { });
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
    }).catch(() => { });
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
      <button
        type="button"
        disabled={!hasStory}
        onClick={() => setOpen(true)}
        className={cn(
          "relative w-40 h-40 sm:w-48 sm:h-48 overflow-hidden rounded-full bg-line mx-auto block",
          "shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.08)]",
          hasStory ? "cursor-pointer" : "cursor-default",
          hasStory && !allSeen && "ring-[3px] ring-coral ring-offset-2 ring-offset-white",
          hasStory && allSeen && "ring-[2px] ring-black/10 ring-offset-2 ring-offset-white",
        )}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="192px"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/[0.04]">
            <p className="text-[13px] text-muted">Sem foto</p>
          </div>
        )}

        {/* Story pill indicator */}
        {hasStory && (
          <span
            className={cn(
              "pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur-sm",
              !allSeen ? "bg-coral shadow-sm" : "bg-black/40",
            )}
          >
            <Play className="h-2 w-2 fill-white" strokeWidth={0} />
            {localGroup?.stories.length}
          </span>
        )}
      </button>

      {/* ── Story viewer overlay ── */}
      <Modal
        open={open && !!localGroup && !!activeStory}
        onClose={close}
        position="fullscreen"
        className="bg-black/90 backdrop-blur-sm flex items-center justify-center w-full"
      >
        {open && localGroup && activeStory ? (
          <div
            className="relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden sm:h-[90vh] sm:rounded-xl cursor-default"
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
              <button type="button" className="cursor-pointer touch-manipulation" onClick={(e) => { e.stopPropagation(); prev(); }} />
              <button type="button" className="cursor-pointer touch-manipulation" onClick={(e) => { e.stopPropagation(); next(); }} />
            </div>

            {/* Bottom bar */}
            <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-12 pointer-events-none">
              <span className="flex items-center gap-1.5 text-sm text-white/70 pointer-events-none">
                <Eye className="h-4 w-4" strokeWidth={1.5} />
                {activeStory.viewCount}
              </span>
              {isClient ? (
                <button
                  className="pointer-events-auto flex items-center gap-1.5 text-sm text-white"
                  onClick={(e) => { e.stopPropagation(); toggleLike(); }}
                >
                  <Heart className={cn("h-6 w-6 transition", activeStory.likedByMe ? "fill-coral text-coral scale-110" : "text-white/80")} strokeWidth={1.5} />
                  <span className="text-xs text-white/70">{activeStory.likeCount}</span>
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
        ) : null}
      </Modal>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryGroup } from "@/lib/queries";

const STORY_DURATION = 5000; // ms for image stories

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  return "há 1 dia";
}

export function StoryBar({
  groups,
  isClient,
}: {
  groups: StoryGroup[];
  /** Whether the viewer is a logged-in user (client OR provider) who can interact */
  isClient: boolean;
}) {
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [localGroups, setLocalGroups] = useState<StoryGroup[]>(() => {
    // hydrated from sessionStorage on client
    return groups;
  });

  // Restore sessionStorage seen-state on mount
  useEffect(() => {
    try {
      const seen = new Set<string>(JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"));
      if (seen.size === 0) return;
      setLocalGroups((prev) =>
        prev.map((g) => {
          const stories = g.stories.map((s) => seen.has(s.id) ? { ...s, seenByMe: true } : s);
          return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
        }),
      );
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const pathname = usePathname();
  const activeGroup = activeGroupIdx !== null ? localGroups[activeGroupIdx] : null;
  const activeStory = activeGroup?.stories[activeStoryIdx] ?? null;

  const closeViewer = useCallback(() => {
    setActiveGroupIdx(null);
    setActiveStoryIdx(0);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const openGroup = useCallback((groupIdx: number, storyIdx = 0) => {
    setActiveGroupIdx(groupIdx);
    setActiveStoryIdx(storyIdx);
    setProgress(0);
  }, []);

  const goNextStory = useCallback(() => {
    if (activeGroupIdx === null) return;
    const group = localGroups[activeGroupIdx];
    if (activeStoryIdx < group.stories.length - 1) {
      setActiveStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (activeGroupIdx < localGroups.length - 1) {
      setActiveGroupIdx((i) => i! + 1);
      setActiveStoryIdx(0);
      setProgress(0);
    } else {
      closeViewer();
    }
  }, [activeGroupIdx, activeStoryIdx, localGroups, closeViewer]);

  const goPrevStory = useCallback(() => {
    if (activeGroupIdx === null) return;
    if (activeStoryIdx > 0) {
      setActiveStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (activeGroupIdx > 0) {
      const prevGroup = localGroups[activeGroupIdx - 1];
      setActiveGroupIdx((i) => i! - 1);
      setActiveStoryIdx(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [activeGroupIdx, activeStoryIdx, localGroups]);

  // Progress bar + auto-advance
  useEffect(() => {
    if (activeGroupIdx === null || !activeStory) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    setProgress(0);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(goNextStory, STORY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeGroupIdx, activeStoryIdx, activeStory, goNextStory]);

  // Track view — sessionStorage always, API only for logged-in clients
  useEffect(() => {
    if (!activeStory) return;
    // Always persist to sessionStorage
    try {
      const seen = new Set<string>(JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"));
      seen.add(activeStory.id);
      sessionStorage.setItem("prv_seen", JSON.stringify([...seen]));
    } catch { /* ignore */ }
    // Always update local state
    setLocalGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== activeGroupIdx) return g;
        const stories = g.stories.map((s, si) =>
          si !== activeStoryIdx ? s : { ...s, seenByMe: true, viewCount: s.seenByMe ? s.viewCount : s.viewCount + 1 },
        );
        return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
      }),
    );
    // Track on server only for logged-in clients
    if (isClient) {
      fetch("/api/stories/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: activeStory.id }),
      }).catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupIdx, activeStoryIdx]);

  // Close on Escape
  useEffect(() => {
    if (activeGroupIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") goNextStory();
      if (e.key === "ArrowLeft") goPrevStory();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeGroupIdx, closeViewer, goNextStory, goPrevStory]);

  async function toggleLike() {
    if (!activeStory || !isClient) return;
    const res = await fetch("/api/stories/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: activeStory.id }),
    });
    if (res.ok) {
      const { liked } = await res.json();
      setLocalGroups((prev) =>
        prev.map((g, gi) =>
          gi !== activeGroupIdx
            ? g
            : {
              ...g,
              stories: g.stories.map((s, si) =>
                si !== activeStoryIdx
                  ? s
                  : { ...s, likedByMe: liked, likeCount: liked ? s.likeCount + 1 : s.likeCount - 1 },
              ),
            },
        ),
      );
    }
  }

  if (localGroups.length === 0) return null;

  return (
    <>
      {/* ── Story Circles ── */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-5 overflow-x-auto py-4 scrollbar-hide">
            {localGroups.map((group, gi) => (
              <button
                key={group.profileId}
                onClick={() => openGroup(gi, 0)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <div
                  className={cn(
                    "h-[62px] w-[62px] rounded-full p-[3px]",
                    group.allSeen
                      ? "bg-line"
                      : "bg-gradient-to-br from-coral via-pink-500 to-orange-400",
                  )}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white">
                    <Image
                      src={group.coverUrl}
                      alt={group.displayName}
                      fill
                      className="object-cover"
                      sizes="62px"
                    />
                  </div>
                </div>
                <p className="max-w-[62px] truncate text-[10px] font-medium text-muted">
                  {group.displayName.split(" ")[0]}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Story Viewer Overlay ── */}
      {activeGroupIdx !== null && activeGroup && activeStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          {/* Card container */}
          <div className="relative mx-auto flex h-full w-full max-w-sm flex-col sm:h-[90vh] sm:rounded-xl overflow-hidden">

            {/* Progress bars */}
            <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2 pt-3">
              {activeGroup.stories.map((s, si) => (
                <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width:
                        si < activeStoryIdx
                          ? "100%"
                          : si === activeStoryIdx
                            ? `${progress}%`
                            : "0%",
                      transition: si === activeStoryIdx ? "none" : undefined,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Top bar */}
            <div className="absolute inset-x-0 top-5 z-20 flex items-center justify-between px-3 pt-4">
              <Link
                href={`/p/${activeGroup.slug}`}
                onClick={closeViewer}
                className="flex items-center gap-2"
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white/60">
                  <Image src={activeGroup.coverUrl} alt="" fill className="object-cover" sizes="36px" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">{activeGroup.displayName}</p>
                  <p className="mt-0.5 text-[10px] text-white/60">{timeAgo(activeStory.createdAt)}</p>
                </div>
              </Link>
              <button
                onClick={closeViewer}
                className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            {/* Story image */}
            <div className="relative flex-1 bg-black">
              <Image
                src={activeStory.mediaUrl}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />

              {/* Caption */}
              {activeStory.caption && (
                <div className="absolute inset-x-0 bottom-20 px-4">
                  <p className="mx-auto max-w-[90%] rounded-lg bg-black/60 px-4 py-2.5 text-center text-sm text-white backdrop-blur-sm">
                    {activeStory.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Tap zones: left = prev, right = next */}
            <div className="absolute inset-x-0 z-10" style={{ top: "15%", bottom: "15%" }}>
              <div className="flex h-full">
                <button className="flex-1" onClick={goPrevStory} aria-label="Anterior" />
                <button className="flex-1" onClick={goNextStory} aria-label="Próximo" />
              </div>
            </div>

            {/* Bottom bar: views + like */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-12">
              <div className="flex items-center gap-1.5 text-sm text-white/70">
                <Eye className="h-4 w-4" strokeWidth={1.5} />
                <span>{activeStory.viewCount}</span>
              </div>
              {isClient ? (
                <button
                  onClick={toggleLike}
                  className="flex items-center gap-1.5 text-sm text-white"
                >
                  <Heart
                    className={cn(
                      "h-6 w-6 transition",
                      activeStory.likedByMe ? "fill-coral text-coral scale-110" : "text-white/80",
                    )}
                    strokeWidth={1.5}
                  />
                  <span className="text-xs text-white/70">{activeStory.likeCount}</span>
                </button>
              ) : (
                <Link
                  href={`/entrar?callbackUrl=${encodeURIComponent(pathname)}`}
                  className="text-[10px] text-white/50 hover:text-white/80 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  Entre para curtir
                </Link>
              )}
            </div>
          </div>

          {/* Profile prev/next arrows */}
          {activeGroupIdx > 0 && (
            <button
              onClick={() => { setActiveGroupIdx((i) => i! - 1); setActiveStoryIdx(0); setProgress(0); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
            </button>
          )}
          {activeGroupIdx < localGroups.length - 1 && (
            <button
              onClick={() => { setActiveGroupIdx((i) => i! + 1); setActiveStoryIdx(0); setProgress(0); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

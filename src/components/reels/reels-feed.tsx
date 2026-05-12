"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, MessageCircle, Volume2, VolumeX, ChevronDown, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type Reel = {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  profile: {
    id: string;
    slug: string;
    displayName: string;
    coverUrl: string | null;
    cityName: string;
    citySlug: string;
  };
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; slug: string | null };
};

type Props = {
  initialReels: Reel[];
  hasMore: boolean;
  nextCursor: string | null;
  isClient: boolean;
  cityId?: string;
  profileId?: string;
};

function ReelPlayer({
  reel,
  isActive,
  isClient,
}: {
  reel: Reel;
  isActive: boolean;
  isClient: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState(reel.likeCount);
  const [liked, setLiked] = useState(reel.likedByMe);
  const [commentCount, setCommentCount] = useState(reel.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  // Play/pause based on visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [isActive]);

  // Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  async function toggleLike() {
    if (!isClient) return;
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    fetch("/api/media/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: reel.id, liked: next }),
    }).catch(() => {
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
    });
  }

  async function openComments() {
    setShowComments(true);
    if (comments.length) return;
    setLoadingComments(true);
    const res = await fetch(`/api/media/comment?mediaId=${reel.id}`);
    const data = await res.json();
    setComments(data.comments ?? []);
    setLoadingComments(false);
  }

  async function postComment() {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    const res = await fetch("/api/media/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: reel.id, text: commentText }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((c) => [...c, data.comment]);
      setCommentCount((n) => n + 1);
      setCommentText("");
    }
    setPosting(false);
  }

  return (
    <div className="relative h-screen w-full shrink-0 overflow-hidden bg-black snap-start snap-always">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.url}
        loop
        muted={muted}
        playsInline
        className="h-full w-full object-cover"
        onClick={() => setMuted((m) => !m)}
      />

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Bottom left: profile + caption */}
      <div className="absolute bottom-6 left-4 max-w-[calc(100%-80px)]">
        <Link href={`/p/${reel.profile.slug}`} className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white/60">
            {reel.profile.coverUrl ? (
              <Image src={reel.profile.coverUrl} alt="" fill className="object-cover" sizes="36px" />
            ) : (
              <div className="h-full w-full bg-white/20" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white drop-shadow">{reel.profile.displayName}</p>
            <p className="text-[11px] text-white/70">{reel.profile.cityName}</p>
          </div>
        </Link>
        {reel.caption && (
          <p className="mt-2.5 text-sm leading-snug text-white/90 drop-shadow line-clamp-3">
            {reel.caption}
          </p>
        )}
      </div>

      {/* Right sidebar: actions */}
      <div className="absolute bottom-6 right-3 flex flex-col items-center gap-5">
        {/* Mute */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex flex-col items-center gap-1"
        >
          {muted ? (
            <VolumeX className="h-7 w-7 text-white drop-shadow" strokeWidth={1.5} />
          ) : (
            <Volume2 className="h-7 w-7 text-white drop-shadow" strokeWidth={1.5} />
          )}
        </button>

        {/* Like */}
        <button
          onClick={toggleLike}
          disabled={!isClient}
          className={cn(
            "flex flex-col items-center gap-1",
            !isClient && "opacity-60 cursor-not-allowed",
          )}
        >
          <Heart
            className={cn(
              "h-7 w-7 drop-shadow transition",
              liked ? "fill-coral text-coral" : "text-white",
            )}
            strokeWidth={1.5}
          />
          <span className="text-xs font-semibold text-white drop-shadow">{likes}</span>
        </button>

        {/* Comment */}
        <button onClick={openComments} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7 text-white drop-shadow" strokeWidth={1.5} />
          <span className="text-xs font-semibold text-white drop-shadow">{commentCount}</span>
        </button>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div
          className="absolute inset-0 z-10 flex items-end bg-black/50"
          onClick={() => setShowComments(false)}
        >
          <div
            className="w-full max-h-[70vh] overflow-hidden rounded-t-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="font-semibold text-sm">{commentCount} comentários</p>
              <button onClick={() => setShowComments(false)}>
                <X className="h-5 w-5 text-muted" strokeWidth={1.5} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[50vh] px-4 py-3 space-y-4">
              {loadingComments ? (
                <p className="text-center text-sm text-muted py-4">Carregando…</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted py-4">Seja o primeiro a comentar.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
                      {(c.user.name ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {c.user.slug ? `@${c.user.slug}` : c.user.name}
                      </p>
                      <p className="text-sm text-foreground/80 leading-snug">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isClient ? (
              <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && postComment()}
                  placeholder="Adicionar comentário…"
                  maxLength={500}
                  className="flex-1 bg-line px-3 py-2 text-sm outline-none rounded-full"
                />
                <button
                  onClick={postComment}
                  disabled={!commentText.trim() || posting}
                  className="text-coral disabled:opacity-40"
                >
                  <Send className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="border-t border-line px-4 py-3">
                <Link
                  href="/entrar"
                  className="block w-full bg-coral py-2 text-center text-xs font-bold uppercase tracking-wider text-white"
                >
                  Entrar para comentar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scroll hint (first reel only) */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2">
        <ChevronDown className="h-5 w-5 animate-bounce text-white/50" strokeWidth={1.5} />
      </div>
    </div>
  );
}

export function ReelsFeed({ initialReels, hasMore: initialHasMore, nextCursor: initialCursor, isClient, cityId, profileId }: Props) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Track which reel is active via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observers: IntersectionObserver[] = [];
    const items = container.querySelectorAll("[data-reel-item]");
    items.forEach((el, idx) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(idx); },
        { threshold: 0.6 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [reels.length]);

  // Load more when sentinel is visible
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    const params = new URLSearchParams({ cursor, limit: "10" });
    if (cityId) params.set("cityId", cityId);
    if (profileId) params.set("profileId", profileId);
    const res = await fetch(`/api/reels?${params}`);
    const data = await res.json();
    setReels((prev) => [...prev, ...data.reels]);
    setHasMore(data.hasMore);
    setCursor(data.nextCursor);
    setLoading(false);
  }, [loading, hasMore, cursor, cityId, profileId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (reels.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <p className="text-sm">Nenhum reel disponível ainda.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: "none" }}
    >
      {reels.map((reel, idx) => (
        <div key={reel.id} data-reel-item>
          <ReelPlayer reel={reel} isActive={activeIdx === idx} isClient={isClient} />
        </div>
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="flex h-20 items-center justify-center">
        {loading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />}
      </div>
    </div>
  );
}

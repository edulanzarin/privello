"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Heart, MessageCircle, Volume2, VolumeX,
  ChevronDown, X, Send, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Reel = {
  id: string;
  url: string;
  caption: string | null;
  isPrivate: boolean;
  isLocked: boolean;
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
  isSubscriber: boolean;
  cityId?: string;
  profileId?: string;
};

function LockedReelOverlay({ profileSlug }: { profileSlug: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <Lock className="h-8 w-8 text-white" strokeWidth={1.5} />
      </div>
      <div className="text-center px-6">
        <p className="text-[15px] font-semibold text-white">Reel exclusivo</p>
        <p className="mt-1 text-[13px] text-white/60">Assine para desbloquear reels privados</p>
      </div>
      <div className="flex flex-col gap-2 w-44">
        <Link
          href="/assinar"
          className="block rounded-full bg-coral py-2.5 text-center text-[12px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
        >
          Assinar · R$19,90/mês
        </Link>
        <Link
          href={`/p/${profileSlug}`}
          className="block rounded-full border border-white/20 py-2 text-center text-[12px] font-medium text-white/70 transition hover:text-white hover:border-white/40"
        >
          Ver perfil
        </Link>
      </div>
    </div>
  );
}

function ReelPlayer({
  reel,
  isActive,
  isClient,
  isSubscriber,
}: {
  reel: Reel;
  isActive: boolean;
  isClient: boolean;
  isSubscriber: boolean;
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

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reel.isLocked) return;
    if (isActive) {
      v.play().catch(() => { });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [isActive, reel.isLocked]);

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
    <div className="relative h-[calc(100dvh-52px)] w-full shrink-0 bg-black snap-start snap-always flex justify-center">
      <div className="relative h-full w-full max-w-[430px] overflow-hidden">

        {/* Locked overlay */}
        {reel.isLocked && <LockedReelOverlay profileSlug={reel.profile.slug} />}

        {/* Video */}
        {!reel.isLocked && (
          <video
            ref={videoRef}
            src={reel.url}
            loop
            muted={muted}
            playsInline
            className="h-full w-full object-cover"
            onClick={() => setMuted((m) => !m)}
          />
        )}

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Private badge */}
        {reel.isPrivate && (
          <div className="absolute left-3 top-14 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
            <Lock className="h-2.5 w-2.5" strokeWidth={2} />
            Exclusivo
          </div>
        )}

        {/* Bottom left: profile + caption */}
        <div className="absolute bottom-6 left-4 max-w-[calc(100%-80px)]">
          <Link href={`/p/${reel.profile.slug}`} className="flex items-center gap-2.5">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white/40">
              {reel.profile.coverUrl ? (
                <Image src={reel.profile.coverUrl} alt="" fill className="object-cover" sizes="40px" />
              ) : (
                <div className="h-full w-full bg-white/20" />
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white drop-shadow">{reel.profile.displayName}</p>
              <p className="text-[11px] text-white/60">{reel.profile.cityName} · Reels</p>
            </div>
          </Link>
          {!reel.isLocked && reel.caption && (
            <p className="mt-3 text-[13px] leading-snug text-white/90 drop-shadow line-clamp-2">
              {reel.caption}
            </p>
          )}
        </div>

        {/* Right sidebar: actions */}
        {!reel.isLocked && (
          <div className="absolute bottom-6 right-3 flex flex-col items-center gap-6">
            <button onClick={() => setMuted((m) => !m)} className="flex flex-col items-center gap-1">
              {muted ? (
                <VolumeX className="h-7 w-7 text-white drop-shadow" strokeWidth={1.5} />
              ) : (
                <Volume2 className="h-7 w-7 text-white drop-shadow" strokeWidth={1.5} />
              )}
            </button>

            <button
              onClick={toggleLike}
              disabled={!isClient}
              className={cn("flex flex-col items-center gap-1", !isClient && "opacity-50 cursor-not-allowed")}
            >
              <Heart
                className={cn("h-7 w-7 drop-shadow transition", liked ? "fill-coral text-coral" : "text-white")}
                strokeWidth={1.5}
              />
              <span className="text-[11px] font-semibold text-white drop-shadow">{likes}</span>
            </button>

            <button onClick={openComments} className="flex flex-col items-center gap-1">
              <MessageCircle className="h-7 w-7 text-white drop-shadow" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold text-white drop-shadow">{commentCount}</span>
            </button>
          </div>
        )}

        {/* Comments panel — slides up from bottom, above the bottom nav */}
        {showComments && (
          <div
            className="absolute inset-0 z-20 flex items-end"
            onClick={() => setShowComments(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full max-h-[65%] flex flex-col rounded-t-2xl bg-white animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] shrink-0">
                <p className="text-[15px] font-semibold">{commentCount} comentários</p>
                <button
                  onClick={() => setShowComments(false)}
                  className="rounded-full p-1 hover:bg-black/[0.04] transition-colors"
                >
                  <X className="h-5 w-5 text-muted" strokeWidth={1.5} />
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingComments ? (
                  <p className="text-center text-[13px] text-muted py-6">Carregando…</p>
                ) : comments.length === 0 ? (
                  <p className="text-center text-[13px] text-muted py-6">Seja o primeiro a comentar.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-white">
                        {(c.user.name ?? "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-foreground">
                          {c.user.slug ? `@${c.user.slug}` : c.user.name}
                        </p>
                        <p className="text-[13px] text-foreground/80 leading-snug mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment input */}
              {isClient && isSubscriber ? (
                <div className="flex items-center gap-2 border-t border-black/[0.06] px-4 py-3 shrink-0">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && postComment()}
                    placeholder="Adicionar comentário…"
                    maxLength={500}
                    className="flex-1 rounded-full bg-black/[0.04] px-4 py-2 text-[14px] outline-none placeholder:text-muted/60 focus:bg-black/[0.06] transition-colors"
                  />
                  <button
                    onClick={postComment}
                    disabled={!commentText.trim() || posting}
                    className="rounded-full bg-coral p-2 text-white disabled:opacity-30 transition-opacity hover:brightness-110 active:scale-[0.95]"
                  >
                    <Send className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div className="border-t border-black/[0.06] px-4 py-3 text-center shrink-0">
                  <Link
                    href={isClient ? "/assinar" : "/entrar"}
                    className="text-[13px] font-medium text-[#0a84ff] hover:underline"
                  >
                    {isClient ? "Assine para comentar" : "Entre para comentar"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scroll hint */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <ChevronDown className="h-5 w-5 animate-bounce text-white/40" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

export function ReelsFeed({
  initialReels, hasMore: initialHasMore, nextCursor: initialCursor,
  isClient, isSubscriber, cityId, profileId,
}: Props) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (reels.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <p className="text-[14px]">Nenhum reel disponível ainda.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100dvh-52px)] overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: "none" }}
    >
      {reels.map((reel, idx) => (
        <div key={reel.id} data-reel-item>
          <ReelPlayer
            reel={reel}
            isActive={activeIdx === idx}
            isClient={isClient}
            isSubscriber={isSubscriber}
          />
        </div>
      ))}

      <div ref={sentinelRef} className="flex h-20 items-center justify-center bg-black">
        {loading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />}
      </div>
    </div>
  );
}

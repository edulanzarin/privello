"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, Play, X, Heart, MessageCircle, Trash2, Expand, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/constants";
import { MediaLightbox } from "@/components/profile/media-lightbox";

const PAGE_SIZE = 6;

type MediaItem = {
  id: string;
  url: string;
  mediaType: string;
  isPublic: boolean;
  isCover: boolean;
  caption: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; slug: string | null };
};

type Props = {
  media: MediaItem[];
  displayName: string;
  slug: string;
  isClient: boolean;
  isSubscriber: boolean;
  currentUserId?: string;
  isOwner?: boolean;
  reelsCount?: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function sortMedia(arr: MediaItem[]): MediaItem[] {
  const cover = arr.filter((m) => m.isCover);
  const rest = arr
    .filter((m) => !m.isCover)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return [...cover, ...rest];
}

// ── Instagram-style post modal ────────────────────────────────────────────────
function PostModal({
  items,
  startIdx,
  slug,
  displayName,
  isClient,
  isSubscriber,
  currentUserId,
  isOwner,
  onClose,
}: {
  items: MediaItem[];
  startIdx: number;
  slug: string;
  displayName: string;
  isClient: boolean;
  isSubscriber: boolean;
  currentUserId?: string;
  isOwner?: boolean;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const item = items[idx];
  const [muted, setMuted] = useState(true);

  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const justPostedRef = useRef(false);

  const initItem = useCallback((m: MediaItem) => {
    setLikes((prev) => prev[m.id] ? prev : { ...prev, [m.id]: { count: m.likeCount, liked: m.likedByMe } });
    setCommentCounts((prev) => prev[m.id] !== undefined ? prev : { ...prev, [m.id]: m.commentCount });
  }, []);

  useEffect(() => { initItem(item); }, [item, initItem]);

  useEffect(() => {
    if (!isSubscriber) return; // non-subscribers don't see comments
    setComments([]);
    setLoadingComments(true);
    fetch(`/api/media/comment?mediaId=${item.id}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoadingComments(false));
  }, [item.id, isSubscriber]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!justPostedRef.current) return;
    justPostedRef.current = false;
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && idx > 0) setIdx((i) => i - 1);
      if (e.key === "ArrowRight" && idx < items.length - 1) setIdx((i) => i + 1);
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [idx, items.length, onClose]);

  const [likePending, startLikeTransition] = useTransition();

  async function toggleLike() {
    if (!isClient) return;
    if (likePending) return;
    const cur = likes[item.id] ?? { count: item.likeCount, liked: item.likedByMe };
    const next = !cur.liked;
    // Otimismo: aplica imediatamente.
    setLikes((s) => ({ ...s, [item.id]: { count: cur.count + (next ? 1 : -1), liked: next } }));
    startLikeTransition(async () => {
      try {
        const res = await fetch("/api/media/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: item.id, liked: next }),
        });
        if (!res.ok) throw new Error("like failed");
      } catch {
        // Rollback formal ao estado anterior.
        setLikes((s) => ({ ...s, [item.id]: cur }));
      }
    });
  }

  async function postComment() {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    const res = await fetch("/api/media/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: item.id, text: commentText }),
    });
    if (res.ok) {
      const data = await res.json();
      justPostedRef.current = true;
      setComments((c) => [...c, data.comment]);
      setCommentCounts((n) => ({ ...n, [item.id]: (n[item.id] ?? 0) + 1 }));
      setCommentText("");
    }
    setPosting(false);
  }

  async function deleteComment(commentId: string) {
    const res = await fetch("/api/media/comment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setComments((c) => c.filter((x) => x.id !== commentId));
      setCommentCounts((n) => ({ ...n, [item.id]: Math.max(0, (n[item.id] ?? 1) - 1) }));
    }
  }

  const curLike = likes[item.id] ?? { count: item.likeCount, liked: item.likedByMe };
  const curCommentCount = commentCounts[item.id] ?? item.commentCount;

  return (
    <MediaLightbox
      open={true}
      onClose={onClose}
      className="flex min-h-full w-full flex-col bg-white sm:min-h-0 sm:h-[85vh] sm:max-w-5xl sm:flex-row sm:overflow-hidden sm:rounded-2xl sm:shadow-2xl cursor-default"
    >
      <div
        ref={scrollContainerRef}
        className="flex min-h-full w-full flex-col overflow-y-auto sm:min-h-0 sm:h-full sm:flex-row sm:overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60 sm:flex"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* ── Photo ── */}
        <div className="relative aspect-[3/4] w-full shrink-0 bg-black sm:aspect-auto sm:flex-1">
          <button
            onClick={onClose}
            className="absolute left-3 top-3 z-10 flex min-h-[44px] items-center gap-1 rounded-full bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:hidden"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            Voltar
          </button>

          {item.mediaType === "VIDEO" ? (
            <>
              <video src={item.url} autoPlay loop muted={muted} playsInline className={cn("absolute inset-0 h-full w-full object-contain", !item.isPublic && !isSubscriber && "blur-xl")} />
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70"
              >
                {muted ? <VolumeX className="h-4 w-4" strokeWidth={1.5} /> : <Volume2 className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </>
          ) : (
            <Image src={item.url} alt={displayName} fill sizes="(min-width:640px) 50vw, 100vw" className={cn("object-contain", !item.isPublic && !isSubscriber && "blur-xl")} priority />
          )}

          {/* Lock overlay for private items when not subscribed */}
          {!item.isPublic && !isSubscriber && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
              <Lock className="h-8 w-8 text-white" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-white">Conteúdo exclusivo</p>
              <Link
                href={isClient ? `/assinar?from=/p/${slug}` : `/entrar?callbackUrl=${encodeURIComponent(`/assinar?from=/p/${slug}`)}`}
                className="rounded-full bg-coral px-5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-coral/90"
              >
                Assinar para ver
              </Link>
            </div>
          )}

          {items.length > 1 && (
            <>
              <button
                onClick={() => setIdx((i) => i - 1)}
                disabled={idx === 0}
                className="absolute left-2 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-1.5 text-foreground shadow disabled:opacity-0 hover:bg-white"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                onClick={() => setIdx((i) => i + 1)}
                disabled={idx === items.length - 1}
                className="absolute right-2 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-1.5 text-foreground shadow disabled:opacity-0 hover:bg-white"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </>
          )}

          {items.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {items.map((_, i) => (
                <div key={i} className={cn("h-1.5 w-1.5 rounded-full transition", i === idx ? "bg-white" : "bg-white/40")} />
              ))}
            </div>
          )}
        </div>

        {/* ── Info + Comments ── */}
        <div className="flex w-full flex-col bg-white sm:w-[360px] sm:shrink-0 sm:overflow-hidden sm:border-l sm:border-black/[0.06]">
          <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 sm:shrink-0">
            <div className="min-w-0 flex-1">
              <Link href={`/p/${slug}`} className="text-md font-semibold hover:underline">@{slug}</Link>
            </div>
            <p className="text-xs text-muted">{fmtDate(item.createdAt)}</p>
          </div>

          <div className="px-4 py-3 sm:flex-1 sm:overflow-y-auto">
            {/* Caption — visible to everyone */}
            {item.caption && (
              <div className="mb-4">
                <p className="text-sm">
                  <span className="font-bold">@{slug}</span>{" "}
                  <span className="text-foreground/80">{item.caption}</span>
                </p>
              </div>
            )}

            {/* Comments — only visible to subscribers */}
            {isSubscriber ? (
              loadingComments ? (
                <p className="py-4 text-center text-xs text-muted">Carregando…</p>
              ) : comments.length === 0 && !item.caption ? (
                <p className="py-8 text-center text-xs text-muted">Nenhum comentário ainda.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => {
                    const canDelete = c.user.id === currentUserId || isOwner;
                    return (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">
                            <span className="font-bold">{c.user.slug ? `@${c.user.slug}` : c.user.name}</span>{" "}
                            <span className="text-foreground/80">{c.text}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted">{fmtDate(c.createdAt)}</p>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="shrink-0 text-muted/40 hover:text-coral transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )
            ) : (
              /* Non-subscriber: show count + subscribe CTA */
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                {curCommentCount > 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      {curCommentCount} {curCommentCount === 1 ? "comentário" : "comentários"}
                    </p>
                    <p className="text-xs text-muted">Assine para ler os comentários</p>
                    <Link
                      href={isClient ? `/assinar?from=/p/${slug}` : `/entrar?callbackUrl=${encodeURIComponent(`/assinar?from=/p/${slug}`)}`}
                      className="mt-1 rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-white hover:bg-coral/90"
                    >
                      Assinar — {SUBSCRIPTION_PRICE_LABEL}
                    </Link>
                  </>
                ) : !item.caption ? (
                  <p className="text-xs text-muted">Nenhum comentário ainda.</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="border-t border-black/[0.06] px-4 py-3 sm:shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
                disabled={!isClient || likePending}
                className={cn(
                  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition",
                  (!isClient || likePending) && "opacity-40 cursor-not-allowed",
                )}
                aria-label={curLike.liked ? "Descurtir" : "Curtir"}
              >
                <Heart
                  className={cn("h-6 w-6 transition-transform active:scale-125", curLike.liked ? "fill-coral text-coral" : "text-foreground hover:text-muted")}
                  strokeWidth={1.5}
                />
              </button>
              <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center" aria-hidden="true">
                <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={1.5} />
              </span>
              <span className="ml-auto text-xs text-muted">{idx + 1} / {items.length}</span>
            </div>
            <p className="mt-1.5 text-md font-semibold">
              {curLike.count} {curLike.count === 1 ? "curtida" : "curtidas"}
            </p>
          </div>

          {isClient && isSubscriber ? (
            <div className="sticky bottom-0 flex items-center gap-2 border-t border-black/[0.06] bg-white px-4 py-3 sm:static sm:shrink-0">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && postComment()}
                placeholder="Adicione um comentário…"
                maxLength={500}
                className="flex-1 text-md outline-none placeholder:text-muted/60"
              />
              <button onClick={postComment} disabled={!commentText.trim() || posting} className="text-base font-semibold text-blue disabled:opacity-30 transition-opacity">
                Publicar
              </button>
            </div>
          ) : isClient ? (
            <div className="sticky bottom-0 border-t border-black/[0.06] bg-white px-4 py-3 text-center sm:static sm:shrink-0">
              <Link href={`/assinar?from=/p/${slug}`} className="text-base font-medium text-blue hover:underline">
                Assine para comentar
              </Link>
            </div>
          ) : (
            <div className="sticky bottom-0 border-t border-black/[0.06] bg-white px-4 py-3 text-center sm:static sm:shrink-0">
              <Link href={`/entrar?callbackUrl=${encodeURIComponent(`/assinar?from=/p/${slug}`)}`} className="text-base font-medium text-blue hover:underline">
                Entre para curtir e comentar
              </Link>
            </div>
          )}
        </div>
      </div>
    </MediaLightbox>
  );
}

// ── Main gallery component ───────────────────────────────────────────────────
export function MediaGallery({ media, displayName, slug, isClient, isSubscriber, currentUserId, isOwner, reelsCount }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"fotos" | "reels">("fotos");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const imageItems = sortMedia(media.filter((m) => m.mediaType !== "VIDEO" && m.mediaType !== "REEL"));

  const activeItems = tab === "fotos" ? imageItems : [];
  const displayed = activeItems.slice(0, visibleCount);
  const hasMore = visibleCount < activeItems.length;

  function switchTab(t: typeof tab) {
    if (t === "reels") { router.push(`/reels/${slug}`); return; }
    setTab(t);
    setVisibleCount(PAGE_SIZE);
    setOpenIdx(null);
  }

  function handleItemClick(m: MediaItem, idxInActive: number) {
    setOpenIdx(idxInActive);
  }

  const tabs = [
    { key: "fotos" as const, label: "Fotos", count: imageItems.length },
    { key: "reels" as const, label: "Reels", count: reelsCount ?? null },
  ];

  return (
    <div className="mb-10">
      <div className="flex gap-1 border-b border-black/[0.06] pt-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === t.key
                ? "text-foreground bg-white border border-black/[0.06] border-b-white -mb-px"
                : "text-muted hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== null && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-2xs font-semibold", tab === t.key ? "bg-coral/10 text-coral" : "bg-black/[0.04] text-muted")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeItems.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-md text-muted">
            {"Nenhuma foto publicada."}
          </p>
        </div>
      ) : (
        <div className="pb-6">
          <div className="grid grid-cols-3 gap-1 mt-4 rounded-xl overflow-hidden">
            {displayed.map((m, i) => {
              const isPrivate = !m.isPublic;
              const locked = isPrivate && !isSubscriber;
              return (
                <button
                  key={m.id}
                  onClick={() => handleItemClick(m, activeItems.indexOf(m))}
                  className="group relative overflow-hidden bg-line"
                  style={{ aspectRatio: "3/4" }}
                >
                  {m.mediaType === "VIDEO" ? (
                    <video
                      src={m.url}
                      muted
                      preload="metadata"
                      playsInline
                      className={cn("h-full w-full object-cover transition duration-300 group-hover:brightness-75", locked && "blur-md")}
                    />
                  ) : (
                    <Image
                      src={m.url}
                      alt={`${displayName} — ${i + 1}`}
                      fill
                      className={cn("object-cover transition duration-300 group-hover:brightness-75", locked && "blur-md")}
                      sizes="(max-width:640px) 33vw, 25vw"
                    />
                  )}

                  {m.mediaType === "VIDEO" && !locked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-black/50 p-3">
                        <Play className="h-5 w-5 fill-white text-white" strokeWidth={0} />
                      </div>
                    </div>
                  )}

                  {/* Private locked overlay */}
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                      <Lock className="h-5 w-5 text-white" strokeWidth={1.5} />
                      <span className="rounded-full bg-coral px-3 py-1 text-2xs font-bold uppercase tracking-wide text-white">
                        Assinar
                      </span>
                    </div>
                  )}

                  {/* Hover/tap overlay — stats on desktop, expand hint on mobile */}
                  {!locked && (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition active:opacity-100 group-hover:opacity-100">
                      {m.likeCount > 0 ? (
                        <>
                          <span className="flex items-center gap-1 text-sm font-bold text-white">
                            <Heart className="h-4 w-4 fill-white" strokeWidth={0} />
                            {m.likeCount}
                          </span>
                          {m.commentCount > 0 && (
                            <span className="flex items-center gap-1 text-sm font-bold text-white">
                              <MessageCircle className="h-4 w-4 fill-white" strokeWidth={0} />
                              {m.commentCount}
                            </span>
                          )}
                        </>
                      ) : (
                        <Expand className="h-5 w-5 text-white/80" strokeWidth={1.5} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {hasMore && (
            <div className="border-t border-line bg-white p-4 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="text-xs font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                Ver mais · {activeItems.length - visibleCount} restantes
              </button>
            </div>
          )}
        </div>
      )}

      {openIdx !== null && (
        <PostModal
          items={activeItems}
          startIdx={openIdx}
          slug={slug}
          displayName={displayName}
          isClient={isClient}
          isSubscriber={isSubscriber}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}

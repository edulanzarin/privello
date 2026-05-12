"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

type MediaItem = { id: string; url: string; mediaType: string; isCover: boolean };

type Props = {
  photos: MediaItem[];
  privateCount: number;
  displayName: string;
};

export function MediaGallery({ photos, privateCount, displayName }: Props) {
  const [tab, setTab] = useState<"fotos" | "videos" | "reels">("fotos");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const imageItems = photos.filter((m) => m.mediaType !== "VIDEO");
  const videoItems = photos.filter((m) => m.mediaType === "VIDEO");

  const activeItems = tab === "fotos" ? imageItems : videoItems;
  const displayed = activeItems.slice(0, visibleCount);
  const hasMore = visibleCount < activeItems.length;

  // Reset pagination on tab change
  const switchTab = (t: typeof tab) => { setTab(t); setVisibleCount(PAGE_SIZE); };

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevPhoto = useCallback(() =>
    setLightbox((i) => (i === null || i === 0 ? imageItems.length - 1 : i - 1)), [imageItems.length]);
  const nextPhoto = useCallback(() =>
    setLightbox((i) => (i === null ? 0 : (i + 1) % imageItems.length)), [imageItems.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightbox, closeLightbox, prevPhoto, nextPhoto]);

  const tabs = [
    { key: "fotos" as const,  label: "Fotos",  count: imageItems.length },
    { key: "videos" as const, label: "Vídeos", count: videoItems.length },
    { key: "reels" as const,  label: "Reels",  count: 0 },
  ];

  return (
    <div className="mb-10">
      {/* Tab bar */}
      <div className="flex border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition",
              tab === t.key
                ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-coral"
                : "text-muted hover:text-foreground",
            )}
          >
            {t.label}
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[10px]",
              tab === t.key ? "bg-coral/10 text-coral" : "bg-line text-muted",
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "reels" ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <Play className="mx-auto h-10 w-10 text-muted/40" strokeWidth={1} />
            <p className="mt-3 text-sm font-medium text-muted">Reels em breve</p>
            <p className="mt-1 text-xs text-muted/60">Esta acompanhante ainda não publicou reels.</p>
          </div>
        </div>
      ) : tab === "videos" && videoItems.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <Play className="mx-auto h-10 w-10 text-muted/40" strokeWidth={1} />
            <p className="mt-3 text-sm font-medium text-muted">Nenhum vídeo</p>
          </div>
        </div>
      ) : (
        <div className="pb-6">
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {displayed.map((m, i) => (
              <button
                key={m.id}
                onClick={() => tab === "fotos" && setLightbox(imageItems.indexOf(m))}
                className="group relative aspect-square overflow-hidden bg-line"
              >
                {m.mediaType === "VIDEO" ? (
                  <video
                    src={m.url}
                    muted
                    preload="metadata"
                    playsInline
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-90"
                  />
                ) : (
                  <Image
                    src={m.url}
                    alt={`${displayName} — ${i + 1}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-90"
                    sizes="(max-width:640px) 33vw, 25vw"
                  />
                )}
                {m.mediaType === "VIDEO" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-3">
                      <Play className="h-5 w-5 fill-white text-white" strokeWidth={0} />
                    </div>
                  </div>
                )}
              </button>
            ))}

            {/* Private count cell — show after last visible item on last page */}
            {!hasMore && privateCount > 0 && tab === "fotos" && (
              <div className="relative flex aspect-square items-center justify-center bg-foreground/90">
                <div className="text-center text-white">
                  <Lock className="mx-auto h-5 w-5 opacity-60" strokeWidth={1.5} />
                  <p className="mt-1.5 text-lg font-bold">+{privateCount}</p>
                  <p className="text-[9px] uppercase tracking-wider opacity-60">privadas</p>
                </div>
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="border-t border-line bg-white p-4 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="text-xs font-semibold uppercase tracking-wider text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                Ver mais · {activeItems.length - visibleCount} restantes
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox !== null && imageItems[lightbox] && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
        >
          <div
            className="relative flex h-full w-full max-w-3xl flex-col items-center justify-center px-12"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
              {lightbox + 1} / {imageItems.length}
            </p>
            <button
              onClick={closeLightbox}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="relative max-h-[85vh] w-full">
              <Image
                src={imageItems[lightbox].url}
                alt=""
                width={900}
                height={1200}
                className="mx-auto max-h-[85vh] w-auto object-contain"
                priority
              />
            </div>
            {imageItems.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:left-3"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:right-3"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

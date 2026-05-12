"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaItem = { id: string; url: string; isCover: boolean; mediaType?: string };

type Props = {
  photos: MediaItem[];
  privateCount: number;
  displayName: string;
};

const PAGE_SIZE = 6;

function isVideo(url: string, mediaType?: string) {
  return mediaType === "VIDEO" || /\.(mp4|webm|mov)$/i.test(url);
}

export function MediaTabs({ photos, privateCount, displayName }: Props) {
  const images = photos.filter((m) => !isVideo(m.url, m.mediaType));
  const videos = photos.filter((m) => isVideo(m.url, m.mediaType));

  const tabs = [
    { key: "fotos", label: `Fotos (${images.length})`, items: images },
    { key: "videos", label: `Vídeos (${videos.length})`, items: videos },
  ].filter((t) => t.items.length > 0 || t.key === "fotos");

  const [activeTab, setActiveTab] = useState("fotos");
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const current = tabs.find((t) => t.key === activeTab) ?? tabs[0];
  const items = current?.items ?? [];
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function switchTab(key: string) {
    setActiveTab(key);
    setPage(0);
    setLightbox(null);
  }

  if (photos.length === 0 && privateCount === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-line">
        <p className="text-sm text-muted">Sem fotos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
                activeTab === t.key
                  ? "border-b-2 border-coral text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid 6 per page */}
      {pageItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {pageItems.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setLightbox(page * PAGE_SIZE + i)}
              className="group relative aspect-square overflow-hidden bg-line"
            >
              {isVideo(m.url, m.mediaType) ? (
                <video src={m.url} className="h-full w-full object-cover" muted />
              ) : (
                <Image
                  src={m.url}
                  alt={`${displayName} — foto ${page * PAGE_SIZE + i + 1}`}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width:1024px) 33vw, 200px"
                />
              )}
              {m.isCover && (
                <span className="absolute left-1 top-1 bg-coral px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  Capa
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted">Nenhum item nesta categoria.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs font-semibold text-muted disabled:opacity-30 hover:text-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            Anterior
          </button>
          <span className="text-xs text-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-xs font-semibold text-muted disabled:opacity-30 hover:text-foreground transition"
          >
            Próxima
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Private teaser */}
      {privateCount > 0 && (
        <div className="flex items-center gap-2 border border-dashed border-line bg-black/3 px-4 py-3 text-xs text-muted">
          <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>+{privateCount} fotos privadas — exclusivas para assinantes</span>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && items[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((l) => Math.max(0, l! - 1)); }}
            disabled={lightbox === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {isVideo(items[lightbox].url, items[lightbox].mediaType) ? (
              <video src={items[lightbox].url} controls className="max-h-[90vh] max-w-[90vw]" autoPlay />
            ) : (
              <img src={items[lightbox].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
            )}
            <p className="mt-2 text-center text-xs text-white/50">{lightbox + 1} / {items.length}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((l) => Math.min(items.length - 1, l! + 1)); }}
            disabled={lightbox === items.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white disabled:opacity-30"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

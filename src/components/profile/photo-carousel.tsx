"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Photo = { id: string; url: string; isCover: boolean };

type Props = {
  photos: Photo[];
  privateCount: number;
  displayName: string;
};

export function PhotoCarousel({ photos, privateCount, displayName }: Props) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1));

  if (photos.length === 0) {
    return (
      <div className="relative aspect-[4/5] w-full bg-line flex items-center justify-center">
        <p className="text-sm text-muted">Sem fotos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main photo */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-line">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <Image
              src={p.url}
              alt={`${displayName} — foto ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </>
        )}

        {/* Counter */}
        <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {current + 1} / {photos.length}
        </span>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrent(i)}
              className={cn(
                "relative h-16 w-12 shrink-0 overflow-hidden border-2 transition",
                i === current ? "border-coral" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image src={p.url} alt="" fill className="object-cover" sizes="48px" />
            </button>
          ))}

          {/* Private photos teaser */}
          {privateCount > 0 && (
            <div className="relative flex h-16 w-12 shrink-0 items-center justify-center border-2 border-dashed border-line bg-black/5">
              <div className="text-center">
                <Lock className="mx-auto h-4 w-4 text-muted" strokeWidth={1.5} />
                <p className="mt-0.5 text-2xs font-semibold text-muted">+{privateCount}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";

/**
 * Player de áudio completo com barra de progresso clicável e contador `mm:ss / mm:ss`.
 *
 * Renderizado na página de perfil público quando o anúncio possui um clipe de voz.
 *
 * Props:
 * - `src` (string): URL absoluta do arquivo de áudio (geralmente `.webm` em `/uploads`).
 *
 * Consumidores conhecidos:
 * - src/app/p/[slug]/page.tsx
 *
 * Side effects:
 * - `useEffect` registra listeners `timeupdate`/`loadedmetadata`/`ended` no `<audio>`.
 * - Clique na barra de progresso ajusta `audio.currentTime` via `getBoundingClientRect`.
 */
export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnded = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="mt-6 flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white px-4 py-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Volume2 className="h-4 w-4 shrink-0 text-coral" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted">Ouça minha voz</p>
        {/* Waveform progress bar */}
        <div
          className="mt-1.5 h-1.5 w-full cursor-pointer rounded-full bg-line overflow-hidden"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}
        >
          <div
            className="h-full rounded-full bg-coral transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {duration > 0 && (
          <p className="mt-1 text-2xs text-muted">{fmt(progress)} / {fmt(duration)}</p>
        )}
      </div>
      <button
        onClick={toggle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-white hover:bg-coral/90 transition"
      >
        {playing
          ? <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
          : <Play className="h-4 w-4 fill-white translate-x-[1px]" strokeWidth={0} />
        }
      </button>
    </div>
  );
}

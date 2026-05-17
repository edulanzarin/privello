"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AudioPlayer — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/profile/audio-player.tsx
 * Steering: `.kiro/steering/design-system.md` §4 (typography), §5.4 (shadow).
 *
 * Player de áudio completo com barra de progresso clicável e contador
 * `mm:ss / mm:ss`. Renderizado na página de perfil público quando o
 * anúncio possui um clipe de voz.
 *
 * Visual v2:
 *  - Card branco com border-line + shadow-sm.
 *  - Ícone Volume2 em rose, label "Ouça minha voz" em ink-dim.
 *  - Barra de progresso: trilha bg-line, fill em bg-rose.
 *  - Botão play/pause: bg-rose com hover brilho (mesmo padrão do Button primary).
 *
 * Props:
 *  - `src` (string): URL absoluta do arquivo de áudio.
 *
 * Side effects:
 *  - `useEffect` registra listeners `timeupdate`/`loadedmetadata`/`ended`.
 *  - Clique na barra ajusta `audio.currentTime` via `getBoundingClientRect`.
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
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
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
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
    }
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <Volume2 className="h-4 w-4 shrink-0 text-rose" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Ouça minha voz
        </p>
        <div
          className="mt-1.5 h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-line"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}
        >
          <div
            className="h-full rounded-full bg-rose transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {duration > 0 && (
          <p className="mt-1 text-2xs tabular-nums text-ink-dim">
            {fmt(progress)} / {fmt(duration)}
          </p>
        )}
      </div>
      <button
        onClick={toggle}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          "bg-rose text-white shadow-[var(--shadow-sm)]",
          "transition-all duration-150 ease-[var(--ease-tahoe)]",
          "hover:brightness-105 active:brightness-95 active:scale-[0.96]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        aria-label={playing ? "Pausar áudio" : "Tocar áudio"}
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
        ) : (
          <Play
            className="h-4 w-4 fill-white translate-x-[1px]"
            strokeWidth={0}
          />
        )}
      </button>
    </div>
  );
}

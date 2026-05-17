"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botão compacto "Ouça minha voz" — Design System v2.4 (Tahoe Sensual).
 *
 * Caminho: src/components/profile/audio-play-button.tsx
 * Steering: `.kiro/steering/design-system.md` §3.2.
 *
 * Props:
 * - `src` (string): URL do arquivo de áudio.
 * - `className?`: classes Tailwind extras.
 *
 * Side effects:
 * - Instancia `new Audio(src)` lazy no primeiro clique.
 * - `e.preventDefault()` + `e.stopPropagation()` para não disparar o `<Link>`
 *   pai do card.
 */
export function AudioPlayButton({ src, className }: { src: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setPlaying(false);
    }

    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => { });
      setPlaying(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        playing
          ? "bg-rose text-white"
          : "border border-line bg-background text-rose hover:bg-rose-soft",
        className,
      )}
    >
      {playing ? (
        <VolumeX className="h-3 w-3 shrink-0" strokeWidth={2.2} />
      ) : (
        <Volume2 className="h-3 w-3 shrink-0" strokeWidth={2.2} />
      )}
      Ouça minha voz
    </button>
  );
}

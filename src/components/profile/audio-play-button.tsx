"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botão compacto "Ouça minha voz" que toca/pausa um clipe de áudio inline em cards de perfil.
 *
 * Props:
 * - `src` (string): URL absoluta do arquivo de áudio (geralmente `.webm` em `/uploads`).
 * - `className?` (string): classes Tailwind extras encaminhadas ao botão.
 *
 * Consumidores conhecidos:
 * - src/components/profile/profile-card.tsx
 *
 * Side effects:
 * - Instancia `new Audio(src)` lazy no primeiro clique e mantém em `useRef`.
 * - `e.preventDefault()` + `e.stopPropagation()` para não disparar o `<Link>` pai do card.
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
        "flex items-center gap-1 rounded-full px-2 py-[3px] text-2xs font-medium transition",
        playing
          ? "border border-coral/30 bg-coral/10 text-coral"
          : "border border-black/[0.07] bg-white text-muted hover:border-coral/20 hover:text-coral",
        className,
      )}
    >
      {playing ? (
        <VolumeX className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
      ) : (
        <Volume2 className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
      )}
      Ouça minha voz
    </button>
  );
}

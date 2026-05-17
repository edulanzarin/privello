"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ShareButton — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/profile/share-button.tsx
 * Steering: `.kiro/steering/design-system.md` §6.3.
 *
 * Botão "Compartilhar" que usa `navigator.share` quando disponível (mobile)
 * e cai para `navigator.clipboard.writeText` (com feedback "Copiado!" 2s)
 * em desktop. Visual idêntico ao secondary CTA (white card + line border).
 *
 * Props:
 * - `displayName` (string): título do diálogo nativo.
 * - `slug` (string): slug pra montar `${origin}/p/[slug]`.
 * - `className?` (string): classes extras.
 *
 * Side effects:
 * - Browser API: `navigator.share`, `navigator.clipboard.writeText`,
 *   `window.prompt` (fallback).
 */
export function ShareButton({
  displayName,
  slug,
  className,
}: {
  displayName: string;
  slug: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/p/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} — Privello`, url });
        return;
      } catch {
        // User cancelled or not supported — fall through.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Compartilhar perfil"
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-base font-medium text-ink",
        "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
        "hover:bg-line/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" strokeWidth={2.4} />
      ) : (
        <Share2 className="h-4 w-4" strokeWidth={2} />
      )}
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}

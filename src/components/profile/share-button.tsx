"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({ displayName, slug, className }: { displayName: string; slug: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/p/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${displayName} — Privello`, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (HTTP / no permission) — show prompt as last resort
      window.prompt("Copie o link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-base font-medium text-foreground shadow-sm transition-all hover:bg-black/[0.03] active:scale-[0.97]${className ? ` ${className}` : ""}`}
      title="Compartilhar perfil"
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" strokeWidth={2} />
      ) : (
        <Share2 className="h-4 w-4" strokeWidth={1.5} />
      )}
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}

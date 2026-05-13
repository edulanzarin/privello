"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({ displayName, slug }: { displayName: string; slug: string }) {
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
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center justify-center gap-2 border border-line px-4 py-3 text-sm font-medium text-muted transition hover:border-foreground/30 hover:text-foreground"
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

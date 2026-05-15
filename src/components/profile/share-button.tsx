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
      className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition-all hover:bg-black/[0.03] active:scale-[0.97]"
      title="Compartilhar perfil"
    >
      {copied ? (
        <Check className="h-4 w-4 text-[#30d158]" strokeWidth={2} />
      ) : (
        <Share2 className="h-4 w-4" strokeWidth={1.5} />
      )}
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}

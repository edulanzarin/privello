"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton({
  phone,
  profileId,
}: {
  phone: string | null;
  profileId: string;
}) {
  const digits = phone?.replace(/\D/g, "") ?? "";

  function handleClick() {
    fetch("/api/wa-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, source: "perfil" }),
    }).catch(() => {});
  }

  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral/90 transition"
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      WhatsApp
    </a>
  );
}

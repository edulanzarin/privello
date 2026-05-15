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
    }).catch(() => { });
  }

  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.97]"
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      WhatsApp
    </a>
  );
}

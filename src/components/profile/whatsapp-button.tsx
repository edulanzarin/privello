"use client";

import { MessageCircle } from "lucide-react";
import { trackWhatsAppClick } from "@/app/_actions/track-whatsapp";

type Props = {
  phone: string;
  profileId: string;
  source?: string;
  className?: string;
  label?: string;
};

export function WhatsAppButton({ phone, profileId, source = "Botão do perfil", className, label = "WhatsApp" }: Props) {
  const href = `https://wa.me/${phone.replace(/\D/g, "")}`;

  function handleClick() {
    // Fire-and-forget tracking
    trackWhatsAppClick(profileId, source).catch(() => {});
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      {label}
    </a>
  );
}

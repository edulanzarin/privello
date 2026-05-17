"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WhatsAppButton — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/profile/whatsapp-button.tsx
 * Steering: `.kiro/steering/design-system.md` §3.3 (whatsapp token), §6.3.
 *
 * Abre `https://wa.me/<digits>` em nova aba; renderiza nada quando `phone`
 * é nulo ou sem dígitos. Visual padrão Button whatsapp variant (verde da
 * marca, mesmo estilo de gradiente/transição que primary).
 *
 * Props:
 * - `phone` (string | null): telefone (sanitizado por dígitos).
 * - `profileId` (string): preservado por compat — tracking acontece via
 *   `/api/wa-click` em outras camadas; este componente é só link nativo.
 * - `className?` (string): classes extras.
 */
export function WhatsAppButton({
  phone,
  profileId: _profileId,
  className,
}: {
  phone: string | null;
  profileId: string;
  className?: string;
}) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-medium",
        "bg-whatsapp text-white shadow-[var(--shadow-sm)]",
        "transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97]",
        "hover:brightness-105 active:brightness-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={2} />
      WhatsApp
    </a>
  );
}

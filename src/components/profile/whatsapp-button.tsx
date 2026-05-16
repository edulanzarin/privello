"use client";

import { MessageCircle } from "lucide-react";

/**
 * Botão "WhatsApp" que abre `https://wa.me/<digits>` em nova aba; renderiza nada
 * quando `phone` é nulo ou vazio (sem dígitos válidos).
 *
 * Props:
 * - `phone` (string | null): telefone do perfil; sanitizado via `replace(/\D/g, "")`.
 * - `profileId` (string): id do perfil — atualmente preservado por compatibilidade (handler de tracking
 *   está no fluxo `/api/wa-click` chamado em outras camadas; este componente é só o link nativo).
 * - `className?` (string): classes Tailwind extras.
 *
 * Consumidores conhecidos:
 * - src/app/p/[slug]/page.tsx
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

  function handleClick() { }

  if (!digits) return null;

  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-base font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.97]${className ? ` ${className}` : ""}`}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
      WhatsApp
    </a>
  );
}

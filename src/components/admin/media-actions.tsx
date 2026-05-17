"use client";

import { useState, useTransition } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { deleteAdminMedia, toggleMediaVisibility } from "@/app/_actions/admin-moderation";

/**
 * Botão "Apagar" mídia em duas etapas (clique inicial → "Confirmar/Não" inline)
 * usado no painel admin de mídias.
 *
 * Props:
 * - `mediaId` (string): id da mídia a deletar.
 *
 * Consumidores conhecidos:
 * - src/app/admin/midias/page.tsx
 *
 * Side effects:
 * - Server action `deleteAdminMedia(mediaId)` em `src/app/_actions/admin-moderation.ts`.
 */
export function MediaDeleteBtn({ mediaId }: { mediaId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => start(async () => { await deleteAdminMedia(mediaId); })}
          disabled={pending}
          className="bg-red-600 text-white text-2xs font-bold px-2 py-1 hover:bg-red-700 transition disabled:opacity-40"
        >
          {pending ? "…" : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-2xs text-ink-dim hover:text-ink border border-line px-2 py-1 transition"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1 text-2xs font-bold px-2 py-1 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
      title="Apagar mídia"
    >
      <Trash2 className="h-3 w-3" strokeWidth={2} />
      Apagar
    </button>
  );
}

/**
 * Botão "Privar/Publicar" mídia que alterna a visibilidade pública.
 *
 * Props:
 * - `mediaId` (string): id da mídia a togglar.
 * - `isPublic` (boolean): estado atual (controla label/cor do botão).
 *
 * Consumidores conhecidos:
 * - src/app/admin/midias/page.tsx
 *
 * Side effects:
 * - Server action `toggleMediaVisibility(mediaId)` em `src/app/_actions/admin-moderation.ts`.
 */
export function MediaVisibilityBtn({ mediaId, isPublic }: { mediaId: string; isPublic: boolean }) {
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => start(async () => { await toggleMediaVisibility(mediaId); })}
      disabled={pending}
      className={`flex items-center gap-1 text-2xs font-bold px-2 py-1 border transition disabled:opacity-40 ${isPublic
        ? "border-line text-ink-dim hover:border-ink/30 hover:text-ink"
        : "border-success/30 bg-success-soft text-success-dark hover:bg-success/15"
        }`}
      title={isPublic ? "Tornar privada" : "Tornar pública"}
    >
      {pending ? "…" : isPublic ? (
        <><EyeOff className="h-3 w-3" strokeWidth={2} /> Privar</>
      ) : (
        <><Eye className="h-3 w-3" strokeWidth={2} /> Publicar</>
      )}
    </button>
  );
}

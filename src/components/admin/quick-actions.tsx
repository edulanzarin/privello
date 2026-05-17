"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveVerification, rejectVerification } from "@/app/_actions/verification";

/**
 * Par de botões "Aprovar / Rejeitar" para casos de verificação na fila de moderação.
 *
 * Props:
 * - `caseId` (string): id do `VerificationCase` a aprovar/rejeitar.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 *
 * Side effects:
 * - Server actions `approveVerification(caseId)` / `rejectVerification(caseId)`
 *   em `src/app/_actions/verification.ts`.
 * - `router.refresh()` após cada ação para re-buscar dados da fila.
 */
export function QuickActions({ caseId }: { caseId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function approve() {
    start(async () => {
      await approveVerification(caseId);
      router.refresh();
    });
  }

  function reject() {
    start(async () => {
      await rejectVerification(caseId);
      router.refresh();
    });
  }

  if (pending) {
    return <span className="text-2xs text-muted">Salvando…</span>;
  }

  // Botões de ação rápida usam tokens do design system (Req 1: success-soft,
  // danger-soft). Antes consumiam paleta crua `bg-emerald-*` / `bg-red-*`,
  // bloqueada pelo regression-light de `/admin/moderacao` (Task 12.2).
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={approve}
        title="Aprovar"
        aria-label="Aprovar verificação"
        className="flex h-7 w-7 items-center justify-center rounded bg-success-soft text-success transition hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <button
        onClick={reject}
        title="Rejeitar"
        aria-label="Rejeitar verificação"
        className="flex h-7 w-7 items-center justify-center rounded bg-danger-soft text-danger transition hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Ban, CheckCircle } from "lucide-react";
import {
  giveWarning,
  suspendProfile,
  unsuspendProfile,
} from "@/app/_actions/admin-moderation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

type WarningFormProps = {
  profileId: string;
  profileName: string;
  warningCount: number;
  isSuspended: boolean;
};

/**
 * WarningForm — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/admin/warning-form.tsx
 * Steering: §3 (cor semântica), §6.3 (Button variants), §3.4 (soft surfaces).
 *
 * Cluster de ações de moderação para um perfil:
 * - Badge de advertências em pílula warning-soft / warning / danger conforme
 *   intensidade (1, 2, 3+).
 * - Botões "Advertir" (warning-subtle outline), "Suspender" (danger outline),
 *   "Reativar" (success).
 * - Modal com `<Textarea>` v2 para motivo (bottom-sheet em mobile, center desktop).
 *
 * Side effects:
 * - Server actions `giveWarning`, `suspendProfile`, `unsuspendProfile`.
 * - `useMediaQuery("(max-width: 640px)")` para escolher posição do modal.
 */
export function WarningForm({
  profileId,
  profileName,
  warningCount,
  isSuspended,
}: WarningFormProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"warn" | "suspend">("warn");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const isMobile = useMediaQuery("(max-width: 640px)");

  function openModal(m: "warn" | "suspend") {
    setMode(m);
    setReason("");
    setError("");
    setOpen(true);
  }

  function handleUnsuspend() {
    start(async () => {
      const res = await unsuspendProfile(profileId);
      if (res.error) setError(res.error);
    });
  }

  function handleSubmit() {
    setError("");
    start(async () => {
      if (mode === "warn") {
        const res = await giveWarning(profileId, reason);
        if (res.error) {
          setError(res.error);
          return;
        }
      } else {
        const res = await suspendProfile(profileId, reason);
        if (res.error) {
          setError(res.error);
          return;
        }
      }
      setOpen(false);
      setReason("");
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Warning badge */}
        {warningCount > 0 && (
          <span
            className={
              warningCount >= 3
                ? "inline-flex items-center rounded-full bg-danger px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white"
                : warningCount === 2
                  ? "inline-flex items-center rounded-full bg-warning-soft px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-warning"
                  : "inline-flex items-center rounded-full bg-cream px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-ink"
            }
          >
            {warningCount} adv.
          </span>
        )}

        {isSuspended ? (
          <button
            type="button"
            onClick={handleUnsuspend}
            disabled={pending}
            title="Reativar conta"
            className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-success transition hover:bg-success/15 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
          >
            <CheckCircle className="h-3 w-3" strokeWidth={2} />
            Reativar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openModal("warn")}
              title="Dar advertência"
              className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-warning transition hover:bg-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
            >
              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
              Advertir
            </button>
            <button
              type="button"
              onClick={() => openModal("suspend")}
              title="Suspender conta"
              className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-danger transition hover:bg-danger/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
            >
              <Ban className="h-3 w-3" strokeWidth={2} />
              Suspender
            </button>
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        position={isMobile ? "bottom" : "center"}
        className="w-full max-w-sm bg-white p-6 shadow-[var(--shadow-lg)]"
      >
        <h2 className="text-md font-semibold tracking-[-0.011em] text-ink">
          {mode === "warn" ? "Advertir" : "Suspender"} —{" "}
          <span className="font-normal text-ink-dim">{profileName}</span>
        </h2>
        <p className="mt-1 mb-4 text-xs leading-relaxed text-ink-dim">
          {mode === "warn"
            ? `Advertência ${warningCount + 1}/3. Ao atingir 3, a conta é suspensa automaticamente.`
            : "A conta será suspensa e o perfil ficará invisível."}
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            mode === "warn"
              ? "Motivo da advertência…"
              : "Motivo da suspensão…"
          }
          rows={3}
        />
        {error && (
          <p className="mt-2 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={mode === "warn" ? "primary" : "danger"}
            size="sm"
            onClick={handleSubmit}
            disabled={pending || !reason.trim()}
            loading={pending}
          >
            {pending
              ? "Enviando…"
              : mode === "warn"
                ? "Confirmar advertência"
                : "Confirmar suspensão"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

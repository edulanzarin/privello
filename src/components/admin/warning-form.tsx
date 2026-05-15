"use client";

import { useState, useTransition } from "react";
import { giveWarning, suspendProfile, unsuspendProfile } from "@/app/_actions/admin-moderation";
import { AlertTriangle, Ban, CheckCircle } from "lucide-react";

type WarningFormProps = {
  profileId: string;
  profileName: string;
  warningCount: number;
  isSuspended: boolean;
};

export function WarningForm({ profileId, profileName, warningCount, isSuspended }: WarningFormProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"warn" | "suspend">("warn");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

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
        if (res.error) { setError(res.error); return; }
      } else {
        const res = await suspendProfile(profileId, reason);
        if (res.error) { setError(res.error); return; }
      }
      setOpen(false);
      setReason("");
    });
  }

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        {/* Warning badge */}
        {warningCount > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${warningCount >= 3 ? "bg-red-100 text-red-700" : warningCount === 2 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
            {warningCount} adv.
          </span>
        )}

        {isSuspended ? (
          <button
            onClick={handleUnsuspend}
            disabled={pending}
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-success/30 bg-success/10 text-success hover:bg-success/20 transition disabled:opacity-40"
            title="Reativar conta"
          >
            <CheckCircle className="h-3 w-3" strokeWidth={2} />
            Reativar
          </button>
        ) : (
          <>
            <button
              onClick={() => openModal("warn")}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
              title="Dar advertência"
            >
              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
              Advertir
            </button>
            <button
              onClick={() => openModal("suspend")}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
              title="Suspender conta"
            >
              <Ban className="h-3 w-3" strokeWidth={2} />
              Suspender
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-sm mb-1">
              {mode === "warn" ? "Advertir" : "Suspender"} — <span className="font-normal text-muted">{profileName}</span>
            </h2>
            <p className="text-[11px] text-muted mb-4">
              {mode === "warn"
                ? `Advertência ${warningCount + 1}/3. Ao atingir 3, a conta é suspensa automaticamente.`
                : "A conta será suspensa e o perfil ficará invisível."}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={mode === "warn" ? "Motivo da advertência…" : "Motivo da suspensão…"}
              rows={3}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all resize-none"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-xs border border-line hover:bg-line active:scale-[0.97] transition">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={pending || !reason.trim()}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition active:scale-[0.97] disabled:opacity-40 ${mode === "warn" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {pending ? "Enviando…" : mode === "warn" ? "Confirmar advertência" : "Confirmar suspensão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

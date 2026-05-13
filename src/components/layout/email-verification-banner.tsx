"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/app/_actions/email-verification";
import { X } from "lucide-react";

export function EmailVerificationBanner({ userId }: { userId: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  function handleResend() {
    startTransition(async () => {
      await resendVerificationEmail(userId);
      setSent(true);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm">
      <p className="text-amber-900">
        {sent ? (
          "E-mail de verificação enviado! Verifique sua caixa de entrada."
        ) : (
          <>
            Confirme seu e-mail para acessar todos os recursos.{" "}
            <button
              onClick={handleResend}
              disabled={isPending}
              className="font-semibold underline underline-offset-2 disabled:opacity-50"
            >
              {isPending ? "Enviando…" : "Reenviar link"}
            </button>
          </>
        )}
      </p>
      <button onClick={() => setDismissed(true)} className="shrink-0 text-amber-700 hover:text-amber-900">
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

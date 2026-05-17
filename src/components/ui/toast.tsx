"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Primitivo `Toast` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/ui/toast.tsx
 * Steering: `.kiro/steering/design-system.md` §3 + §5.4.
 *
 * Toasts em `glass-panel` flutuante, canto inferior-direito (desktop) ou
 * inferior do viewport (mobile, acima do bottom-nav). Auto-dismiss em 3.5s.
 *
 * Tipos:
 *  - `success`: ícone CheckCircle em `text-success`.
 *  - `error`: ícone XCircle em `text-danger` (era "coral" na v1; semântica
 *    de erro pertence a danger).
 */
type ToastType = "success" | "error";
type Toast = { id: number; message: string; type: ToastType };

type ToastCtx = { toast: (message: string, type?: ToastType) => void };
const ToastContext = createContext<ToastCtx>({ toast: () => { } });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Counter persistente entre renders. `useRef` em vez de `let counter = 0`
  // (que era resetado em todo render, gerando IDs colididos).
  const counterRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — acima do bottom-nav em mobile (h-14 + safe-area). */}
      <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
              "animate-in slide-in-from-right-4 duration-200",
              t.type === "success" ? "text-ink" : "text-danger",
            )}
          >
            {t.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-success" strokeWidth={2} />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
            )}
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fechar notificação"
              className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

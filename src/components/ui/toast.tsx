"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // (que era resetado em todo render, gerando IDs colididos quando dois toasts
  // abriam simultaneamente). Ref muta sem causar re-render — comportamento desejado.
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
      {/* Toast container */}
      <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              "animate-in slide-in-from-right-4 duration-200",
              t.type === "success"
                ? "border-success/30 bg-white text-foreground"
                : "border-coral/30 bg-white text-coral",
            )}
          >
            {t.type === "success"
              ? <CheckCircle className="h-4 w-4 shrink-0 text-success" strokeWidth={2} />
              : <XCircle className="h-4 w-4 shrink-0 text-coral" strokeWidth={2} />
            }
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

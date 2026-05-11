"use client";

import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";

type Props = {
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
  successMessage?: string;
  className?: string;
};

/**
 * Wraps a server action form with toast feedback.
 * Use this instead of <form action={serverAction}> when you want toast confirmation.
 */
export function SaveForm({ action, children, successMessage = "Salvo com sucesso.", className }: Props) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
        toast(successMessage, "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar.";
        // Next.js redirect throws — don't show as error
        if (!msg.includes("NEXT_REDIRECT")) {
          toast(msg, "error");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}

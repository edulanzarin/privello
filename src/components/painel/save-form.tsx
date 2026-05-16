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
 * Wrapper de `<form>` que executa um server action e mostra toast de sucesso/erro
 * com base no resultado. Use em vez de `<form action={serverAction}>` quando quiser
 * confirmação visual via toast.
 *
 * Props:
 * - `action` ((fd: FormData) => Promise<void>): server action a executar no submit.
 * - `children` (ReactNode): conteúdo do formulário (campos + botão de submit).
 * - `successMessage?` (string): texto do toast de sucesso (default: "Salvo com sucesso.").
 * - `className?` (string): classes Tailwind extras encaminhadas ao `<form>`.
 *
 * Consumidores conhecidos:
 * - Atualmente sem importadores ativos no codebase — utilitário disponível para futuros formulários no painel.
 *
 * Side effects:
 * - Executa server action em `useTransition` e dispara `useToast` com sucesso/erro.
 * - Suprime toast quando o erro é `NEXT_REDIRECT` (Next.js sinaliza redirect via throw).
 */
export function SaveForm({ action, children, successMessage = "Salvo com sucesso.", className }: Props) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();

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

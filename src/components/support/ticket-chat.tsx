"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { replyTicket } from "@/app/_actions/support";

type Message = {
  id: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
  user: { name: string | null };
};

/**
 * TicketChat — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/support/ticket-chat.tsx
 * Steering: `.kiro/steering/design-system.md` §3 (tokens), §6.3 (Button),
 * §3.4 (rose-soft / line/40 surfaces).
 *
 * Chat de ticket de suporte (cliente ↔ admin). Visual estilo iMessage:
 * - Bolha do cliente (autor atual): `bg-rose text-white`, alinhada à direita.
 * - Bolha do admin: `bg-line/40 text-ink`, alinhada à esquerda.
 * - Textarea com border-line + ring rose canônico.
 * - Botão de envio: pill rose com ícone `<Send>`.
 *
 * Props:
 * - `ticketId` (string): id do `SupportTicket`.
 * - `messages` (Message[]): lista inicial vinda do RSC.
 * - `isClosed` (boolean): se fechado, esconde input e mostra rodapé estático.
 * - `currentUserId` (string): mantido por compat (não usado no JSX).
 *
 * Consumidores:
 * - src/app/painel/suporte/[id]/page.tsx (provider)
 * - src/app/admin/suporte/[id]/page.tsx (admin)
 *
 * Side effects:
 * - Server action `replyTicket(ticketId, text)` em `src/app/_actions/support.ts`.
 * - Atualização otimista local + rollback em caso de erro.
 * - `router.refresh()` após envio bem-sucedido.
 * - `bottomRef.scrollIntoView({ behavior: "smooth" })` em cada nova mensagem.
 */
export function TicketChat({
  ticketId,
  messages: initial,
  isClosed,
  currentUserId: _currentUserId,
}: {
  ticketId: string;
  messages: Message[];
  isClosed: boolean;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!text.trim() || isPending) return;
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      text: text.trim(),
      isAdmin: false,
      createdAt: new Date().toISOString(),
      user: { name: "Você" },
    };
    setMessages((m) => [...m, optimistic]);
    const sent = text.trim();
    setText("");
    startTransition(async () => {
      const res = await replyTicket(ticketId, sent);
      if (res.error) {
        setError(res.error);
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col">
      <div
        className="flex flex-col gap-3 overflow-y-auto px-4 py-4"
        style={{ maxHeight: "60vh" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex max-w-[80%] flex-col",
              msg.isAdmin ? "self-start" : "items-end self-end",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-snug",
                msg.isAdmin
                  ? "rounded-tl-sm bg-line/40 text-ink"
                  : "rounded-tr-sm bg-rose text-white shadow-[var(--shadow-sm)]",
              )}
            >
              {msg.text}
            </div>
            <span className="mt-0.5 text-2xs tabular-nums text-ink-faint">
              {msg.isAdmin ? "Suporte · " : ""}
              {new Date(msg.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p
          role="alert"
          className="mx-4 mb-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}

      {!isClosed ? (
        <div className="flex items-end gap-2 border-t border-line px-4 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escreva sua mensagem… (Enter para enviar)"
            rows={2}
            maxLength={2000}
            className="flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2 text-md text-ink placeholder:text-ink-dim/55 outline-none transition-all duration-150 ease-[var(--ease-tahoe)] hover:border-ink/15 focus:border-rose/50 focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || isPending}
            aria-label="Enviar mensagem"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-rose p-2.5 text-white shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:brightness-105 active:brightness-95 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="border-t border-line px-4 py-3 text-center text-sm text-ink-dim">
          Ticket fechado.
        </div>
      )}
    </div>
  );
}

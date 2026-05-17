"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { replyTicket } from "@/app/_actions/support";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
  user: { name: string | null };
};

/**
 * Chat de ticket de suporte (cliente ↔ admin). Lista mensagens com bolhas
 * estilo iMessage, permite enviar nova mensagem com Enter (Shift+Enter quebra linha)
 * e mostra estado "Ticket fechado" quando aplicável.
 *
 * Props:
 * - `ticketId` (string): id do `SupportTicket` para o qual estamos respondendo.
 * - `messages` (Message[]): lista inicial de mensagens (vinda do RSC).
 * - `isClosed` (boolean): se o ticket está fechado (esconde input + mostra rodapé estático).
 * - `currentUserId` (string): id do usuário logado (atualmente usado só para tipo, sem leitura no JSX).
 *
 * Consumidores conhecidos:
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
      <div className="flex flex-col gap-3 px-4 py-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex flex-col max-w-[80%]", msg.isAdmin ? "self-start" : "self-end items-end")}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-snug",
                msg.isAdmin
                  ? "rounded-tl-sm bg-line text-foreground"
                  : "rounded-tr-sm bg-foreground text-white",
              )}
            >
              {msg.text}
            </div>
            <span className="mt-0.5 text-2xs text-muted">
              {msg.isAdmin ? "Suporte · " : ""}
              {new Date(msg.createdAt).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs text-red-600">{error}</p>}

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
            className="flex-1 resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-md text-foreground shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isPending}
            className="shrink-0 rounded-xl bg-foreground p-2.5 text-white transition hover:bg-foreground/80 active:scale-[0.97] disabled:opacity-40"
          >
            <Send className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <div className="border-t border-black/[0.06] px-4 py-3 text-center text-base text-muted">
          Ticket fechado.
        </div>
      )}
    </div>
  );
}

/**
 * Página RSC — Painel do provider: lista de tickets de suporte + abrir novo.
 *
 * Rota: `/painel/suporte`.
 * Tipo: Server Component (form de criação dispara server action).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lista filtra por `userId` da sessão).
 *
 * Form de novo ticket + histórico próprio.
 *
 * Cross-refs:
 * - src/app/_actions/support.ts (openTicket)
 * - src/app/painel/suporte/[id]/page.tsx
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openTicket } from "@/app/_actions/support";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 34 (lista de tickets do provider).
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Fechado",
};
const statusClass: Record<string, string> = {
  OPEN: "bg-info/10 text-rose",
  IN_PROGRESS: "bg-warning/10 text-warning-dark",
  CLOSED: "bg-line/50 text-ink-dim",
};

export default async function PainelSuportePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc"},
    include: {
      messages: { orderBy: { createdAt: "desc"}, take: 1, select: { text: true, isAdmin: true } },
      _count: { select: { messages: true } },
    },
  });

  async function create(formData: FormData) {
"use server";
    const res = await openTicket(formData);
    if (res.ticketId) redirect(`/painel/suporte/${res.ticketId}`);
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Suporte</h1>
        <p className="mt-1 text-md text-ink-dim">Abra um chamado e nossa equipe responderá em breve.</p>
      </div>

      {/* New ticket form */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <p className="flex items-center gap-2 text-md font-semibold">
          <Plus className="h-4 w-4 text-ink-dim"strokeWidth={1.5} />
          Novo chamado
        </p>
        <form action={create} className="space-y-3">
          <input
            name="subject"required
            placeholder="Assunto"maxLength={120}
            className="w-full rounded-lg border border-line bg-white px-3 py-[7px] text-md text-ink shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:border-black/20 focus:border-rose focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"/>
          <textarea
            name="text"required
            rows={4}
            placeholder="Descreva o problema ou dúvida…"maxLength={2000}
            className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-md text-ink shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:border-black/20 focus:border-rose focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"/>
          <button
            type="submit"className="min-h-[44px] rounded-lg bg-ink px-5 py-2.5 text-base font-semibold text-white transition hover:bg-ink/80 active:scale-[0.97]">
            Abrir chamado
          </button>
        </form>
      </div>

      {/* Ticket list */}
      {tickets.length > 0 && (
        <div className="space-y-2">
          <p className="text-base font-medium text-ink-dim">Chamados anteriores</p>
          {tickets.map((t) => {
            const last = t.messages[0];
            return (
              <Link
                key={t.id}
                href={`/painel/suporte/${t.id}`}
                className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 transition hover:bg-black/[0.02]">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-dim"strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-md font-semibold">{t.subject}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-semibold ${statusClass[t.status] ?? ""}`}>
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  {last && (
                    <p className="mt-0.5 truncate text-base text-ink-dim">
                      {last.isAdmin ? "Suporte: ": "Você: "}{last.text}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-dim">
                    {t._count.messages} mensagem{t._count.messages !== 1 ? "s": ""} ·{""}
                    {new Date(t.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Página RSC — Painel do provider: lista de tickets de suporte + abrir novo.
 *
 * Rota: `/painel/suporte`.
 * Tipo: Server Component (form de criação dispara server action).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lista filtra por `userId` da sessão).
 *
 * Visual v2 (Tahoe Sensual):
 * - `<Card variant="solid">` para form de novo ticket.
 * - `<Input>` + `<Textarea>` v2 (sem CSS inline duplicado).
 * - `<Button variant="primary" size="lg">` (substitui botão `bg-ink` ad-hoc).
 * - Status pills: rose-soft (OPEN), warning-soft (IN_PROGRESS), line/40 (CLOSED).
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Fechado",
};

const statusClass: Record<string, string> = {
  OPEN: "bg-rose-soft text-rose",
  IN_PROGRESS: "bg-warning-soft text-warning",
  CLOSED: "bg-line/40 text-ink-dim",
};

export default async function PainelSuportePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { text: true, isAdmin: true },
      },
      _count: { select: { messages: true } },
    },
  });

  async function create(formData: FormData) {
    "use server";
    const res = await openTicket(formData);
    if (res.ticketId) redirect(`/painel/suporte/${res.ticketId}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
          Suporte
        </h1>
        <p className="mt-2 text-md text-ink-dim">
          Abra um chamado e nossa equipe responderá em breve.
        </p>
      </div>

      {/* New ticket form */}
      <Card variant="solid" padding="md">
        <p className="mb-4 inline-flex items-center gap-2 text-md font-semibold tracking-[-0.011em] text-ink">
          <Plus className="h-4 w-4 text-ink-dim" strokeWidth={1.75} />
          Novo chamado
        </p>
        <form action={create} className="space-y-3">
          <Input
            name="subject"
            placeholder="Assunto"
            maxLength={120}
            required
          />
          <Textarea
            name="text"
            rows={4}
            placeholder="Descreva o problema ou dúvida…"
            maxLength={2000}
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="min-h-[44px]"
          >
            Abrir chamado
          </Button>
        </form>
      </Card>

      {/* Ticket list */}
      {tickets.length > 0 && (
        <div className="space-y-2">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Chamados anteriores
          </p>
          {tickets.map((t) => {
            const last = t.messages[0];
            return (
              <Link
                key={t.id}
                href={`/painel/suporte/${t.id}`}
                className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-hairline)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:-translate-y-px hover:border-rose/30 hover:bg-rose-soft hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MessageCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-ink-dim"
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-md font-semibold text-ink">
                      {t.subject}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider ${statusClass[t.status] ?? ""}`}
                    >
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  {last && (
                    <p className="mt-0.5 truncate text-base text-ink-dim">
                      {last.isAdmin ? "Suporte: " : "Você: "}
                      {last.text}
                    </p>
                  )}
                  <p className="mt-1 text-xs tabular-nums text-ink-faint">
                    {t._count.messages} mensagem
                    {t._count.messages !== 1 ? "s" : ""} ·{" "}
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

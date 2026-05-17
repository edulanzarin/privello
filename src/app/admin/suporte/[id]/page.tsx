/**
 * Página RSC — Admin chat de ticket de suporte.
 *
 * Rota: `/admin/suporte/[id]`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`; também
 *  re-checa `auth()` para acessar `session.user.id` do operador).
 * Cache: `force-dynamic` (mensagens em tempo real).
 *
 * Detalhe e chat de um `SupportTicket`. Permite fechar/reabrir o ticket e
 * delega o input de mensagens ao componente `TicketChat`.
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx
 * - src/components/admin/admin-shell.tsx
 * - src/components/support/ticket-chat.tsx
 * - src/app/_actions/support.ts (closeTicket, reopenTicket)
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketChat } from "@/components/support/ticket-chat";
import { closeTicket, reopenTicket } from "@/app/_actions/support";
import { AdminShell } from "@/components/admin/admin-shell";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 42 (admin chat ticket).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminTicketPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc"},
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!ticket) notFound();

  const messages = ticket.messages.map((m) => ({
    id: m.id,
    text: m.text,
    isAdmin: m.isAdmin,
    createdAt: m.createdAt.toISOString(),
    user: { name: m.user.name },
  }));

  async function handleClose() {
"use server";
    await closeTicket(id);
    redirect("/admin/suporte");
  }

  async function handleReopen() {
"use server";
    await reopenTicket(id);
  }

  const statusLabel: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    CLOSED: "Fechado",
  };

  return (
    <AdminShell>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/suporte"className="mb-2 inline-flex items-center gap-1 text-xs text-ink-dim hover:text-ink transition">
            ← Suporte
          </Link>
          <h1 className="text-lg font-bold">{ticket.subject}</h1>
          <p className="text-sm text-ink-dim">
            {ticket.user.name} · {ticket.user.email} ·{""}
            <span className="font-semibold">{statusLabel[ticket.status]}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {ticket.status !== "CLOSED"? (
            <form action={handleClose}>
              <button type="submit"className="border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-dim hover:text-ink transition">
                Fechar ticket
              </button>
            </form>
          ) : (
            <form action={handleReopen}>
              <button type="submit"className="border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-dim hover:text-ink transition">
                Reabrir
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="rounded border border-line bg-white shadow-sm">
        <TicketChat
          ticketId={id}
          messages={messages}
          isClosed={ticket.status === "CLOSED"}
          currentUserId={session.user.id}
        />
      </div>
    </AdminShell>
  );
}

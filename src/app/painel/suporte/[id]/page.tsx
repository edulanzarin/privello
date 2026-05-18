/**
 * Página RSC — Painel do provider: chat de ticket de suporte.
 *
 * Rota: `/painel/suporte/[id]`.
 * Tipo: Server Component (chat é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`;
 *  retorna 404 se o ticket não pertencer ao usuário.
 * Cache: `force-dynamic` (mensagens em tempo real).
 *
 * Visual v2 (Tahoe Sensual):
 * - Container `rounded-2xl border-line bg-white shadow-sm`.
 * - Status pills consistentes com `/painel/suporte`.
 *
 * Cross-refs:
 * - src/components/support/ticket-chat.tsx
 * - src/app/_actions/support.ts
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketChat } from "@/components/support/ticket-chat";

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

type PageProps = { params: Promise<{ id: string }> };

export default async function TicketDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!ticket || ticket.userId !== session.user.id) notFound();

  const messages = ticket.messages.map((m) => ({
    id: m.id,
    text: m.text,
    isAdmin: m.isAdmin,
    createdAt: m.createdAt.toISOString(),
    user: { name: m.user.name },
  }));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link
        href="/painel/suporte"
        className="inline-flex items-center gap-1.5 rounded-md text-base text-ink-dim transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Todos os chamados
      </Link>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-md font-semibold tracking-[-0.011em] text-ink">
              {ticket.subject}
            </p>
            <p className="mt-0.5 text-sm text-ink-dim">
              Aberto em{" "}
              <span className="tabular-nums">
                {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider ${statusClass[ticket.status] ?? ""}`}
          >
            {statusLabel[ticket.status]}
          </span>
        </div>

        <TicketChat
          ticketId={id}
          messages={messages}
          isClosed={ticket.status === "CLOSED"}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}

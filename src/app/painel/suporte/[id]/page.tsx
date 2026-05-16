import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketChat } from "@/components/support/ticket-chat";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 35 (chat de ticket).
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Fechado",
};
const statusClass: Record<string, string> = {
  OPEN: "bg-[#0a84ff]/10 text-[#0a84ff]",
  IN_PROGRESS: "bg-[#ff9500]/10 text-[#b36200]",
  CLOSED: "bg-black/[0.06] text-muted",
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
    <div className="space-y-4 max-w-xl mx-auto">
      <Link
        href="/painel/suporte"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Todos os chamados
      </Link>

      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div>
            <p className="text-[14px] font-semibold">{ticket.subject}</p>
            <p className="mt-0.5 text-[12px] text-muted">
              Aberto em {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass[ticket.status]}`}>
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

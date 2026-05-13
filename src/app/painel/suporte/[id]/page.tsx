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
  OPEN: "bg-sky-100 text-sky-900",
  IN_PROGRESS: "bg-amber-100 text-amber-900",
  CLOSED: "bg-zinc-100 text-zinc-600",
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
    <div className="space-y-4">
      <Link href="/painel/suporte" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Todos os chamados
      </Link>

      <div className="border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="font-semibold">{ticket.subject}</p>
            <p className="text-xs text-muted">
              Aberto em {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass[ticket.status]}`}>
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

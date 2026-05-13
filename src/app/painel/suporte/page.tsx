import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openTicket } from "@/app/_actions/support";

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

export default async function PainelSuportePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, isAdmin: true } },
      _count: { select: { messages: true } },
    },
  });

  async function create(formData: FormData) {
    "use server";
    const res = await openTicket(formData);
    if (res.ticketId) redirect(`/painel/suporte/${res.ticketId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suporte</h1>
          <p className="mt-1 text-sm text-muted">Abra um chamado e nossa equipe responderá em breve.</p>
        </div>
      </div>

      {/* New ticket form */}
      <form action={create} className="border border-line bg-white p-5 space-y-4">
        <p className="font-semibold text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Novo chamado
        </p>
        <input
          name="subject"
          required
          placeholder="Assunto"
          maxLength={120}
          className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground/40"
        />
        <textarea
          name="text"
          required
          rows={4}
          placeholder="Descreva o problema ou dúvida…"
          maxLength={2000}
          className="w-full resize-none border border-line px-3 py-2 text-sm outline-none focus:border-foreground/40"
        />
        <button
          type="submit"
          className="bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-foreground/80 transition"
        >
          Abrir chamado
        </button>
      </form>

      {/* Ticket list */}
      {tickets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Chamados anteriores</p>
          {tickets.map((t) => {
            const last = t.messages[0];
            return (
              <Link
                key={t.id}
                href={`/painel/suporte/${t.id}`}
                className="flex items-start gap-3 border border-line bg-white p-4 hover:bg-line/40 transition"
              >
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{t.subject}</p>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusClass[t.status] ?? ""}`}>
                      {statusLabel[t.status]}
                    </span>
                  </div>
                  {last && (
                    <p className="mt-0.5 text-xs text-muted truncate">
                      {last.isAdmin ? "Suporte: " : "Você: "}{last.text}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted">
                    {t._count.messages} mensagem{t._count.messages !== 1 ? "s" : ""} ·{" "}
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

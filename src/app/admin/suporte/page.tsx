import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 41 (admin lista tickets).
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

export default async function AdminSuportePage() {
  const tickets = await prisma.supportTicket.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, isAdmin: true } },
      _count: { select: { messages: true } },
    },
  });

  const closed = await prisma.supportTicket.findMany({
    where: { status: "CLOSED" },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });

  function TicketRow({ t, dim = false }: { t: typeof tickets[number]; dim?: boolean }) {
    const last = "messages" in t ? (t as typeof tickets[number]).messages?.[0] : undefined;
    return (
      <Link
        href={`/admin/suporte/${t.id}`}
        className={`flex items-start gap-3 border-b border-line px-4 py-3.5 hover:bg-line/40 transition ${dim ? "opacity-60" : ""}`}
      >
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{t.subject}</p>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusClass[t.status]}`}>
              {statusLabel[t.status]}
            </span>
          </div>
          <p className="text-xs text-muted">{t.user.name} · {t.user.email}</p>
          {last && (
            <p className="mt-0.5 text-xs text-muted truncate">
              {last.isAdmin ? "Suporte: " : "Usuário: "}{last.text}
            </p>
          )}
        </div>
        <p className="shrink-0 text-[10px] text-muted">{t._count.messages} msg</p>
      </Link>
    );
  }

  return (
    <AdminShell>
      <h1 className="mb-4 font-bold text-lg">Suporte</h1>

      <div className="rounded border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Abertos e em andamento ({tickets.length})
          </p>
        </div>
        {tickets.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Nenhum chamado pendente.</p>
        ) : (
          tickets.map((t) => <TicketRow key={t.id} t={t} />)
        )}
      </div>

      {closed.length > 0 && (
        <div className="mt-4 rounded border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Fechados recentes</p>
          </div>
          {closed.map((t) => <TicketRow key={t.id} t={t as typeof tickets[number]} dim />)}
        </div>
      )}
    </AdminShell>
  );
}

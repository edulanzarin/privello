/**
 * Página RSC — Admin lista de tickets de suporte (abertos + fechados recentes).
 *
 * Rota: `/admin/suporte`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`).
 * Cache: `force-dynamic` (estado de tickets muda a cada interação).
 *
 * Lista os tickets `OPEN`/`IN_PROGRESS` ordenados pelo mais antigo (FIFO) e
 * mostra os 20 últimos `CLOSED` em uma seção secundária.
 *
 * Migração para o design system (redesign-macos-system, Requirement 10.5):
 * - status agora é renderizado via `<Badge variant={statusToBadgeVariant(...)}>`
 *   (substitui mapa `statusClass` com cores cruas de paleta sky/amber/zinc).
 * - containers de seção usam `<Card variant="solid" padding="none">`
 *   (substitui `rounded border border-line bg-white shadow-sm` cru).
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx
 * - src/components/admin/admin-shell.tsx
 * - src/app/admin/suporte/[id]/page.tsx
 * - src/lib/ui/status.ts — `statusToBadgeVariant`.
 */
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { statusToBadgeVariant } from "@/lib/ui/status";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 41 (admin lista tickets).
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Fechado",
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
        className={`flex items-start gap-3 border-b border-line last:border-0 px-4 py-3.5 hover:bg-line/40 transition ${dim ? "opacity-60" : ""}`}
      >
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{t.subject}</p>
            <Badge variant={statusToBadgeVariant(t.status)} className="shrink-0 uppercase text-2xs">
              {statusLabel[t.status] ?? t.status}
            </Badge>
          </div>
          <p className="text-xs text-muted">{t.user.name} · {t.user.email}</p>
          {last && (
            <p className="mt-0.5 text-xs text-muted truncate">
              {last.isAdmin ? "Suporte: " : "Usuário: "}{last.text}
            </p>
          )}
        </div>
        <p className="shrink-0 text-2xs text-muted">{t._count.messages} msg</p>
      </Link>
    );
  }

  return (
    <AdminShell>
      <h1 className="mb-4 font-bold text-lg">Suporte</h1>

      <Card variant="solid" padding="none" className="overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Abertos e em andamento ({tickets.length})
          </p>
        </div>
        {tickets.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState title="Nenhum chamado pendente" />
          </div>
        ) : (
          tickets.map((t) => <TicketRow key={t.id} t={t} />)
        )}
      </Card>

      {closed.length > 0 && (
        <Card variant="solid" padding="none" className="mt-4 overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Fechados recentes</p>
          </div>
          {closed.map((t) => <TicketRow key={t.id} t={t as typeof tickets[number]} dim />)}
        </Card>
      )}
    </AdminShell>
  );
}

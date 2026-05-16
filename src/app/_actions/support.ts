"use server";

/**
 * Server Actions — Suporte (tickets)
 *
 * Caminho: src/app/_actions/support.ts
 *
 * Cobre o fluxo de suporte:
 * - Provider: `openTicket`, `replyTicket`.
 * - Admin/Moderator: `replyTicket`, `closeTicket`, `reopenTicket`.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`OpenTicketSchema`, `ReplyTicketSchema`,
 *   `CloseTicketSchema`, `ReopenTicketSchema` em
 *   `src/lib/validation/support.schema.ts`).
 * - Autenticação requerida via `auth()`; admin actions exigem
 *   `role ∈ {ADMIN, MODERATOR}`.
 * - `replyTicket` autoriza dono do ticket ou admin; bloqueia ticket fechado.
 *   Se admin responde, ticket `OPEN` passa a `IN_PROGRESS`.
 * - Revalidação de cache via `revalidatePath` em `/painel/suporte` e
 *   `/admin/suporte/*`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.11
 * - src/lib/validation/support.schema.ts
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  OpenTicketSchema,
  ReplyTicketSchema,
  CloseTicketSchema,
  ReopenTicketSchema,
  formDataToObject,
} from "@/lib/validation";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  return session;
}

// ── Provider actions ──────────────────────────────────────────────────────────

/**
 * Abre um ticket de suporte com a primeira mensagem do usuário.
 *
 * @param formData - FormData com:
 *   - `subject` (trim, 1–120 chars).
 *   - `text` (trim, 1–5000 chars).
 * @returns `{ ticketId }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - `prisma.supportTicket.create` com `messages.create` aninhado.
 * - `revalidatePath("/painel/suporte")`.
 *
 * @see src/lib/validation/support.schema.ts (`OpenTicketSchema`)
 */
export async function openTicket(formData: FormData): Promise<{ error?: string; issues?: import("zod").ZodIssue[]; ticketId?: string }> {
  const session = await getSession();
  const parsed = OpenTicketSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { subject, text } = parsed.data;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject,
      messages: {
        create: { userId: session.user.id, text, isAdmin: false },
      },
    },
  });

  revalidatePath("/painel/suporte");
  return { ticketId: ticket.id };
}

/**
 * Posta uma resposta em um ticket. Provider só pode responder ao próprio ticket;
 * admin/moderator pode responder qualquer um. Tickets `CLOSED` rejeitam reply.
 * Resposta de admin em ticket `OPEN` o move para `IN_PROGRESS`.
 *
 * @param ticketId - cuid do `SupportTicket` (`ReplyTicketSchema`).
 * @param text - Texto da mensagem (trim, 1–5000 chars).
 * @returns `{ error?, issues? }` — vazio em sucesso.
 *
 * Side effects:
 * - `prisma.supportMessage.create`.
 * - Pode atualizar `SupportTicket.status` para `IN_PROGRESS`.
 * - Atualiza `SupportTicket.updatedAt`.
 * - `revalidatePath` em `/painel/suporte/<id>` e `/admin/suporte/<id>`.
 *
 * @see src/lib/validation/support.schema.ts (`ReplyTicketSchema`)
 */
export async function replyTicket(ticketId: string, text: string): Promise<{ error?: string; issues?: import("zod").ZodIssue[] }> {
  const session = await getSession();
  const parsed = ReplyTicketSchema.safeParse({ ticketId, text });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { ticketId: tid, text: trimmedText } = parsed.data;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: tid },
    select: { userId: true, status: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  // Provider can only reply to their own ticket; admin can reply to any
  if (!isAdmin && ticket?.userId !== session.user.id) return { error: "Acesso negado." };
  if (ticket?.status === "CLOSED") return { error: "Ticket fechado." };

  await prisma.supportMessage.create({
    data: { ticketId: tid, userId: session.user.id, text: trimmedText, isAdmin },
  });

  if (isAdmin && ticket?.status === "OPEN") {
    await prisma.supportTicket.update({
      where: { id: tid },
      data: { status: "IN_PROGRESS" },
    });
  }

  await prisma.supportTicket.update({
    where: { id: tid },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/painel/suporte/${tid}`);
  revalidatePath(`/admin/suporte/${tid}`);
  return {};
}

// ── Admin actions ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") redirect("/");
  return session;
}

/**
 * Fecha um ticket (admin/moderator).
 *
 * @param ticketId - cuid do `SupportTicket` (`CloseTicketSchema`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.supportTicket.update({ status: "CLOSED" })`.
 * - `revalidatePath` em `/admin/suporte/<id>` e `/admin/suporte`.
 *
 * @see src/lib/validation/support.schema.ts (`CloseTicketSchema`)
 */
export async function closeTicket(ticketId: string): Promise<void> {
  await requireAdmin();
  const parsed = CloseTicketSchema.safeParse({ ticketId });
  if (!parsed.success) return;
  await prisma.supportTicket.update({
    where: { id: parsed.data.ticketId },
    data: { status: "CLOSED" },
  });
  revalidatePath(`/admin/suporte/${parsed.data.ticketId}`);
  revalidatePath("/admin/suporte");
}

/**
 * Reabre um ticket previamente fechado (admin/moderator).
 *
 * @param ticketId - cuid do `SupportTicket` (`ReopenTicketSchema`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.supportTicket.update({ status: "OPEN" })`.
 * - `revalidatePath` em `/admin/suporte/<id>` e `/admin/suporte`.
 *
 * @see src/lib/validation/support.schema.ts (`ReopenTicketSchema`)
 */
export async function reopenTicket(ticketId: string): Promise<void> {
  await requireAdmin();
  const parsed = ReopenTicketSchema.safeParse({ ticketId });
  if (!parsed.success) return;
  await prisma.supportTicket.update({
    where: { id: parsed.data.ticketId },
    data: { status: "OPEN" },
  });
  revalidatePath(`/admin/suporte/${parsed.data.ticketId}`);
  revalidatePath("/admin/suporte");
}

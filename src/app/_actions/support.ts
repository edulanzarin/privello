"use server";

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

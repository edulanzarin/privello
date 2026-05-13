"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  return session;
}

// ── Provider actions ──────────────────────────────────────────────────────────

export async function openTicket(formData: FormData): Promise<{ error?: string; ticketId?: string }> {
  const session = await getSession();
  const subject = (formData.get("subject") as string | null)?.trim();
  const text = (formData.get("text") as string | null)?.trim();

  if (!subject || !text) return { error: "Preencha o assunto e a mensagem." };

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

export async function replyTicket(ticketId: string, text: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!text.trim()) return { error: "Mensagem vazia." };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
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
    data: { ticketId, userId: session.user.id, text: text.trim(), isAdmin },
  });

  if (isAdmin && ticket?.status === "OPEN") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/painel/suporte/${ticketId}`);
  revalidatePath(`/admin/suporte/${ticketId}`);
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
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "CLOSED" },
  });
  revalidatePath(`/admin/suporte/${ticketId}`);
  revalidatePath("/admin/suporte");
}

export async function reopenTicket(ticketId: string): Promise<void> {
  await requireAdmin();
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "OPEN" },
  });
  revalidatePath(`/admin/suporte/${ticketId}`);
  revalidatePath("/admin/suporte");
}

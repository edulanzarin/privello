"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeToMinutes } from "@/lib/time-utils";

export async function createStory(formData: FormData) {
  const profile = await getSessionProfile();
  if (profile.planTier !== "DESTAQUE" && profile.planTier !== "PREMIUM") {
    return { error: "Stories disponíveis no plano Plus ou Premium." };
  }
  const mediaUrl = (formData.get("mediaUrl") as string).trim();
  const caption = (formData.get("caption") as string | null)?.trim() || null;
  if (!mediaUrl) return { error: "URL da mídia obrigatória." };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: { profileId: profile.id, mediaUrl, mediaType: "IMAGE", caption, expiresAt },
  });
  revalidatePath("/painel/stories");
}

export async function deleteStory(formData: FormData) {
  const profile = await getSessionProfile();
  const storyId = (formData.get("storyId") as string).trim();
  if (!storyId) return;
  await prisma.story.deleteMany({ where: { id: storyId, profileId: profile.id } });
  revalidatePath("/painel/stories");
}

async function getSessionProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

export async function saveAvailabilityWindows(formData: FormData) {
  const profile = await getSessionProfile();

  const rows: { weekday: number; startTime: string; endTime: string; status: string }[] = [];

  for (let weekday = 0; weekday <= 6; weekday++) {
    const closed = formData.get(`wd_${weekday}_closed`) === "on";
    const start = String(formData.get(`wd_${weekday}_start`) ?? "09:00").trim();
    const end   = String(formData.get(`wd_${weekday}_end`)   ?? "18:00").trim();
    if (closed) {
      rows.push({ weekday, startTime: "00:00", endTime: "00:00", status: "CLOSED" });
    } else {
      if (timeToMinutes(end) <= timeToMinutes(start)) {
        throw new Error(`Dia ${weekday}: horário final deve ser depois do início.`);
      }
      rows.push({ weekday, startTime: start, endTime: end, status: "AVAILABLE" });
    }
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { profileId: profile.id } }),
    prisma.availabilityRule.createMany({
      data: rows.map((r) => ({ ...r, profileId: profile.id })),
    }),
  ]);

  revalidatePath("/painel/disponibilidade");
  revalidatePath(`/p/${profile.slug}`);
  revalidatePath(`/solicitar/${profile.slug}`);
}

export async function saveDurationOptions(formData: FormData) {
  const profile = await getSessionProfile();

  const options: { minutes: number; label: string; priceBrl: number; sortOrder: number }[] = [];

  for (let i = 0; i < 12; i++) {
    const minutesRaw = formData.get(`dur_${i}_minutes`);
    if (minutesRaw == null || String(minutesRaw).trim() === "") continue;
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(minutes) || minutes < 15 || minutes > 24 * 60 * 2) continue;

    const priceRaw = formData.get(`dur_${i}_price`);
    // Skip rows with empty price — provider doesn't offer this duration
    if (!priceRaw || String(priceRaw).trim() === "") continue;

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) continue;

    const label = String(formData.get(`dur_${i}_label`) ?? "").trim() || `${minutes} min`;
    options.push({ minutes, label, priceBrl: Math.round(price), sortOrder: options.length });
  }

  const paymentMethods = (formData.get("paymentMethods") as string | null)?.trim() || null;
  const oneHour = options.find((o) => o.minutes === 60);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(oneHour ? { priceHour: oneHour.priceBrl } : {}),
        ...(paymentMethods !== undefined ? { paymentMethods } : {}),
      },
    }),
    prisma.profileDurationOption.deleteMany({ where: { profileId: profile.id } }),
    ...(options.length > 0 ? [prisma.profileDurationOption.createMany({
      data: options.map((o) => ({
        profileId: profile.id,
        minutes: o.minutes,
        label: o.label,
        priceBrl: o.priceBrl,
        sortOrder: o.sortOrder,
        active: true,
      })),
    })] : []),
  ]);

  revalidatePath("/painel/valores");
  revalidatePath(`/p/${profile.slug}`);
  revalidatePath(`/solicitar/${profile.slug}`);
}

export async function confirmRequest(formData: FormData) {
  const profile = await getSessionProfile();
  const requestId = formData.get("requestId") as string;
  if (!requestId) return;
  await prisma.meetingRequest.updateMany({
    where: { id: requestId, profileId: profile.id, status: "PENDING" },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/painel/solicitacoes");
}

export async function declineRequest(formData: FormData) {
  const profile = await getSessionProfile();
  const requestId = formData.get("requestId") as string;
  if (!requestId) return;
  await prisma.meetingRequest.updateMany({
    where: { id: requestId, profileId: profile.id, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  revalidatePath("/painel/solicitacoes");
}

export async function updateFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const recordId = (formData.get("recordId") as string).trim();
  if (!recordId) return;

  const clientLabel   = (formData.get("clientLabel") as string).trim();
  const durationLabel = (formData.get("durationLabel") as string).trim();
  const locationLabel = (formData.get("locationLabel") as string).trim();
  const paymentLabel  = (formData.get("paymentLabel") as string).trim();
  const amountBrl     = Number(formData.get("amountBrl"));
  const isNoShow      = formData.get("isNoShow") === "on";

  if (!clientLabel || !amountBrl) return;

  await prisma.financialRecord.updateMany({
    where: { id: recordId, profileId: profile.id },
    data: { clientLabel, durationLabel: durationLabel || "—", locationLabel: locationLabel || "—", paymentLabel: paymentLabel || "—", amountBrl: Math.round(amountBrl), isNoShow },
  });

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
}

export async function deleteFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const recordId = (formData.get("recordId") as string).trim();
  if (!recordId) return;

  await prisma.financialRecord.deleteMany({
    where: { id: recordId, profileId: profile.id },
  });

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
}

export async function changeHandle(formData: FormData): Promise<{ error: string } | undefined> {
  const profile = await getSessionProfile();
  const raw = (formData.get("handle") as string ?? "").trim().toLowerCase().replace(/^@/, "");

  if (!raw) return { error: "Handle não pode ser vazio." };
  if (!/^[a-z0-9_-]{3,30}$/.test(raw)) return { error: "Use letras, números, _ e - (3–30 caracteres)." };

  const existing = await prisma.profile.findFirst({ where: { slug: raw, NOT: { id: profile.id } } });
  if (existing) return { error: `@${raw} já está em uso.` };

  const oldSlug = profile.slug;
  await prisma.profile.update({ where: { id: profile.id }, data: { slug: raw } });

  revalidatePath("/painel");
  revalidatePath("/painel/perfil");
  revalidatePath(`/p/${oldSlug}`);
  revalidatePath(`/p/${raw}`);
}

export async function addFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();

  const clientLabel   = (formData.get("clientLabel") as string).trim();
  const durationLabel = (formData.get("durationLabel") as string).trim();
  const locationLabel = (formData.get("locationLabel") as string).trim();
  const paymentLabel  = (formData.get("paymentLabel") as string).trim();
  const amountBrl     = Number(formData.get("amountBrl"));
  const isNoShow      = formData.get("isNoShow") === "on";
  const notes         = (formData.get("notes") as string | null)?.trim() || null;

  if (!clientLabel || !amountBrl) throw new Error("Preencha cliente e valor.");

  await prisma.financialRecord.create({
    data: {
      profileId: profile.id,
      occurredAt: new Date(),
      clientLabel,
      durationLabel: durationLabel || "—",
      locationLabel: locationLabel || "—",
      paymentLabel:  paymentLabel  || "—",
      origin: "MANUAL",
      amountBrl: Math.round(amountBrl),
      isNoShow,
      notes,
    },
  });

  revalidatePath("/painel/financeiro");
}

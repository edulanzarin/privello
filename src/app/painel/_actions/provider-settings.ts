"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PainelCreateStorySchema,
  PainelDeleteStorySchema,
  SaveAvailabilityWindowsSchema,
  SaveDurationOptionsSchema,
  UpdateFinancialRecordSchema,
  DeleteFinancialRecordSchema,
  AddFinancialRecordSchema,
  ChangeHandleSchema,
  DevActivatePlanSchema,
  formDataToObject,
} from "@/lib/validation";

export async function createStory(formData: FormData) {
  const profile = await getSessionProfile();
  if (profile.planTier !== "DESTAQUE" && profile.planTier !== "PREMIUM") {
    return;
  }
  const parsed = PainelCreateStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;
  const { mediaUrl, caption } = parsed.data;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: { profileId: profile.id, mediaUrl, mediaType: "IMAGE", caption: caption ?? null, expiresAt },
  });
  revalidatePath("/painel/stories");
}

export async function deleteStory(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = PainelDeleteStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;
  await prisma.story.deleteMany({ where: { id: parsed.data.storyId, profileId: profile.id } });
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

  // Build the typed `windows` array the schema expects from the flat
  // `wd_<weekday>_<field>` form.
  const windows: { weekday: number; open: boolean; startTime: string; endTime: string }[] = [];
  for (let weekday = 0; weekday <= 6; weekday++) {
    const open = formData.get(`wd_${weekday}_open`) === "on";
    const startTime = open ? String(formData.get(`wd_${weekday}_start`) ?? "09:00").trim() : "00:00";
    const endTime = open ? String(formData.get(`wd_${weekday}_end`) ?? "18:00").trim() : "00:00";
    windows.push({ weekday, open, startTime, endTime });
  }

  const parsed = SaveAvailabilityWindowsSchema.safeParse({ windows });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const rows = parsed.data.windows.map((w) => ({
    weekday: w.weekday,
    startTime: w.startTime,
    endTime: w.endTime,
    status: w.open ? "AVAILABLE" : "CLOSED",
  }));

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { profileId: profile.id } }),
    prisma.availabilityRule.createMany({
      data: rows.map((r) => ({ ...r, profileId: profile.id })),
    }),
  ]);

  revalidatePath("/painel/disponibilidade");
  revalidatePath(`/p/${profile.slug}`);
}

export async function saveDurationOptions(formData: FormData) {
  const profile = await getSessionProfile();

  // Collect candidate rows from the indexed form fields (`dur_0_minutes`, etc.).
  const candidate: { minutes: number; label?: string; priceBrl: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const minutesRaw = formData.get(`dur_${i}_minutes`);
    if (minutesRaw == null || String(minutesRaw).trim() === "") continue;
    const minutes = Number(minutesRaw);
    if (!Number.isFinite(minutes)) continue;

    const priceRaw = formData.get(`dur_${i}_price`);
    if (!priceRaw || String(priceRaw).trim() === "") continue;
    const price = Number(priceRaw);
    if (!Number.isFinite(price)) continue;

    const label = String(formData.get(`dur_${i}_label`) ?? "").trim() || `${minutes} min`;
    candidate.push({ minutes, label, priceBrl: Math.round(price) });
  }

  const parsed = SaveDurationOptionsSchema.safeParse({
    durations: candidate,
    paymentMethods: formData.get("paymentMethods") ?? undefined,
  });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const { durations, paymentMethods } = parsed.data;
  const options = durations.map((o, sortOrder) => ({ ...o, sortOrder, label: o.label ?? `${o.minutes} min` }));
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
}

export async function updateFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = UpdateFinancialRecordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const d = parsed.data;

  await prisma.financialRecord.updateMany({
    where: { id: d.recordId, profileId: profile.id },
    data: {
      clientLabel: d.clientLabel,
      durationLabel: d.durationLabel || "—",
      locationLabel: d.locationLabel || "—",
      paymentLabel: d.paymentLabel || "—",
      amountBrl: d.amountBrl,
      isNoShow: d.isNoShow,
    },
  });

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
}

export async function deleteFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = DeleteFinancialRecordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  await prisma.financialRecord.deleteMany({
    where: { id: parsed.data.recordId, profileId: profile.id },
  });

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
}

export async function changeHandle(formData: FormData): Promise<{ error: string; issues?: import("zod").ZodIssue[] } | undefined> {
  const profile = await getSessionProfile();
  const raw = (formData.get("handle") as string ?? "").trim().toLowerCase().replace(/^@/, "");

  const parsed = ChangeHandleSchema.safeParse({ handle: raw });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const handle = parsed.data.handle;

  const existing = await prisma.profile.findFirst({ where: { slug: handle, NOT: { id: profile.id } } });
  if (existing) return { error: `@${handle} já está em uso.` };

  const oldSlug = profile.slug;
  await prisma.profile.update({ where: { id: profile.id }, data: { slug: handle } });

  revalidatePath("/painel");
  revalidatePath("/painel/perfil");
  revalidatePath(`/p/${oldSlug}`);
  revalidatePath(`/p/${handle}`);
}

export async function addFinancialRecord(formData: FormData) {
  const profile = await getSessionProfile();
  const parsed = AddFinancialRecordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) throw new Error("Preencha cliente e valor.");
  const d = parsed.data;

  await prisma.financialRecord.create({
    data: {
      profileId: profile.id,
      occurredAt: new Date(),
      clientLabel: d.clientLabel,
      durationLabel: d.durationLabel || "—",
      locationLabel: d.locationLabel || "—",
      paymentLabel: d.paymentLabel || "—",
      origin: "MANUAL",
      amountBrl: d.amountBrl,
      isNoShow: d.isNoShow,
      notes: d.notes ?? null,
    },
  });

  revalidatePath("/painel/financeiro");
}

// ── Boost grátis para Premium (1x por mês) ────────────────────────────────────
export async function useFreeBoost() {
  const profile = await getSessionProfile();

  const now = new Date();
  const hasPlan = profile.planExpiresAt != null && new Date(profile.planExpiresAt) > now;
  if (!hasPlan || profile.planTier !== "PREMIUM") {
    return { error: "Boost grátis disponível apenas no plano Premium." };
  }

  const isBoosted = profile.featuredUntil != null && new Date(profile.featuredUntil) > now;
  if (isBoosted) {
    return { error: "Você já tem um boost ativo." };
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      featuredUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      boostLabel: "Em destaque",
    },
  });

  revalidatePath("/painel/plano");
  revalidatePath("/painel");
  redirect("/painel/plano");
}

// ── Dev only: ativar plano sem pagamento ───────────────────────────────────────
export async function devActivatePlan(formData: FormData) {
  if (process.env.NODE_ENV === "production") return;

  const parsed = DevActivatePlanSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;

  const profile = await getSessionProfile();
  const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      planTier: parsed.data.tier,
      planExpiresAt,
      isOnline: true,
    },
  });

  revalidatePath("/painel/plano");
  revalidatePath("/painel");
  redirect("/painel/plano");
}

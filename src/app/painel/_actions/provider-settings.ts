"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeToMinutes } from "@/lib/time-utils";

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
    if (!Number.isFinite(minutes) || minutes < 15 || minutes > 24 * 60) continue;
    const label = String(formData.get(`dur_${i}_label`) ?? "").trim() || `${minutes} min`;
    const price = Number(formData.get(`dur_${i}_price`));
    if (!Number.isFinite(price) || price < 0) continue;
    options.push({ minutes, label, priceBrl: Math.round(price), sortOrder: options.length });
  }

  if (!options.length) throw new Error("Informe ao menos uma duração com preço.");

  await prisma.$transaction([
    prisma.profileDurationOption.deleteMany({ where: { profileId: profile.id } }),
    prisma.profileDurationOption.createMany({
      data: options.map((o) => ({
        profileId: profile.id,
        minutes: o.minutes,
        label: o.label,
        priceBrl: o.priceBrl,
        sortOrder: o.sortOrder,
        active: true,
      })),
    }),
  ]);

  revalidatePath("/painel/valores");
  revalidatePath(`/p/${profile.slug}`);
  revalidatePath(`/solicitar/${profile.slug}`);
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

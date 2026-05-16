"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  OnboardingPerfilSchema,
  AddPhotoByUrlSchema,
  RemovePhotoSchema,
  SetCoverPhotoSchema,
  UpdateMediaCaptionSchema,
  OnboardingValoresSchema,
  formDataToObject,
} from "@/lib/validation";

async function getProviderProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/entrar");
  return profile;
}

// ── Step 1: Perfil ────────────────────────────────────────────────────────────
export async function saveOnboardingPerfil(formData: FormData) {
  const profile = await getProviderProfile();

  const parsed = OnboardingPerfilSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const d = parsed.data;

  // Upsert city
  const city = await prisma.city.upsert({
    where: { slug: d.citySlug },
    update: {},
    create: {
      slug: d.citySlug,
      name: d.cityQuery || d.citySlug,
    },
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      bio: d.bio,
      tagline: d.tagline || null,
      whatsappPhone: d.whatsappPhone || null,
      cityId: city.id,
      heightCm: d.heightCm ?? null,
      dressSize: d.dressSize ?? null,
      hair: d.hair ?? null,
      eyes: d.eyes ?? null,
      languages: d.languages ?? null,
      servesMen: d.servesMen,
      servesWomen: d.servesWomen,
      servesCouples: d.servesCouples,
      hasOwnPlace: d.hasOwnPlace,
      homeVisit: d.homeVisit,
      travelsNational: d.travelsNational,
      travelsInternational: d.travelsInternational,
    },
  });

  revalidatePath("/conta/onboarding/perfil");
  revalidatePath("/painel/perfil");
  revalidatePath(`/p/${profile.slug}`);

  // Only redirect when called from onboarding (not from painel)
  const fromOnboarding = d._from !== "painel";
  if (fromOnboarding) redirect("/conta/onboarding/fotos");
  return { ok: true };
}

// ── Step 2: Fotos — add a photo by URL ───────────────────────────────────────
export async function addPhotoByUrl(formData: FormData) {
  const profile = await getProviderProfile();
  const parsed = AddPhotoByUrlSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { url, isPublic } = parsed.data;

  // Count existing photos to set sortOrder
  const count = await prisma.media.count({ where: { profileId: profile.id, isPublic } });
  const isCover = isPublic && count === 0; // first public photo = cover

  await prisma.media.create({
    data: { profileId: profile.id, url, isPublic, sortOrder: count, isCover },
  });

  revalidatePath("/conta/onboarding/fotos");
  return { ok: true };
}

export async function removePhoto(mediaId: string) {
  const profile = await getProviderProfile();
  const parsed = RemovePhotoSchema.safeParse({ mediaId });
  if (!parsed.success) return;
  await prisma.media.deleteMany({ where: { id: parsed.data.mediaId, profileId: profile.id } });

  // Re-set cover to first remaining public photo
  const first = await prisma.media.findFirst({
    where: { profileId: profile.id, isPublic: true },
    orderBy: { sortOrder: "asc" },
  });
  if (first) {
    await prisma.media.updateMany({ where: { profileId: profile.id }, data: { isCover: false } });
    await prisma.media.update({ where: { id: first.id }, data: { isCover: true } });
  }

  revalidatePath("/conta/onboarding/fotos");
}

export async function setCoverPhoto(mediaId: string) {
  const profile = await getProviderProfile();
  const parsed = SetCoverPhotoSchema.safeParse({ mediaId });
  if (!parsed.success) return;
  await prisma.media.updateMany({ where: { profileId: profile.id }, data: { isCover: false } });
  await prisma.media.updateMany({ where: { id: parsed.data.mediaId, profileId: profile.id }, data: { isCover: true } });
  revalidatePath("/conta/onboarding/fotos");
}

export async function updateMediaCaption(mediaId: string, caption: string) {
  const profile = await getProviderProfile();
  const parsed = UpdateMediaCaptionSchema.safeParse({ mediaId, caption });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  await prisma.media.updateMany({
    where: { id: parsed.data.mediaId, profileId: profile.id },
    data: { caption: parsed.data.caption || null },
  });
  revalidatePath("/painel/midias");
}

// ── Step 3: Valores ───────────────────────────────────────────────────────────
const DURATION_DEFS = [
  { key: "30min", minutes: 30, label: "30 min" },
  { key: "1h", minutes: 60, label: "1 hora" },
  { key: "2h", minutes: 120, label: "2 horas" },
  { key: "3h", minutes: 180, label: "3 horas" },
  { key: "4h", minutes: 240, label: "4 horas" },
  { key: "overnight", minutes: 720, label: "Pernoite" },
  { key: "travel", minutes: 1440, label: "Diária" },
] as const;

export async function saveOnboardingValores(formData: FormData) {
  const profile = await getProviderProfile();

  // Build candidate durations from the form so the schema can validate them.
  const candidate: { minutes: number; label: string; priceBrl: number; enabled: boolean }[] = [];
  for (const d of DURATION_DEFS) {
    const enabled = formData.get(`enabled_${d.key}`) === "1";
    const priceRaw = formData.get(`price_${d.key}`);
    const price = priceRaw == null ? 0 : Number(priceRaw);
    if (enabled && Number.isFinite(price) && price > 0) {
      candidate.push({ minutes: d.minutes, label: d.label, priceBrl: Math.round(price), enabled: true });
    }
  }

  const parsed = OnboardingValoresSchema.safeParse({
    paymentMethods: formData.get("paymentMethods") ?? undefined,
    durations: candidate,
  });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };

  const { paymentMethods, durations } = parsed.data;
  const options = durations
    .filter((d) => d.enabled)
    .map((d, i) => ({ minutes: d.minutes, label: d.label ?? `${d.minutes} min`, priceBrl: d.priceBrl, sortOrder: i }));

  const oneHour = options.find((o) => o.minutes === 60);
  if (!oneHour) return { error: "Informe o valor para 1 hora (obrigatório)." };

  const twoHours = options.find((o) => o.minutes === 120);
  const overnight = options.find((o) => o.minutes === 720);
  const travel = options.find((o) => o.minutes === 1440);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        priceHour: oneHour.priceBrl,
        priceTwoHours: twoHours?.priceBrl ?? null,
        priceOvernight: overnight?.priceBrl ?? null,
        priceTravelDay: travel?.priceBrl ?? null,
        paymentMethods: paymentMethods ?? null,
      },
    }),
    prisma.profileDurationOption.deleteMany({ where: { profileId: profile.id } }),
    prisma.profileDurationOption.createMany({
      data: options.map((o) => ({ ...o, profileId: profile.id, active: true })),
    }),
  ]);

  revalidatePath("/conta/onboarding/valores");
  redirect("/conta/onboarding/publicar");
}

// ── Step 4: Publicar ──────────────────────────────────────────────────────────
// Aceita FormData implicitamente (via `<form action={...}>`) mas não consome — só checa estado da DB.
export async function publishProfile(): Promise<void> {
  const profile = await getProviderProfile();

  if (!profile.bio || profile.priceHour < 1) {
    redirect("/conta/onboarding/valores");
  }

  const coverPhoto = await prisma.media.findFirst({
    where: { profileId: profile.id, isPublic: true, isCover: true },
  });
  if (!coverPhoto) {
    redirect("/conta/onboarding/fotos");
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { isOnline: true },
  });

  revalidatePath(`/p/${profile.slug}`);
  redirect("/painel");
}

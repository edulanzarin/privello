"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const cityQuery = (formData.get("cityQuery") as string).trim();
  const citySlug  = (formData.get("citySlug") as string).trim();
  const bio       = (formData.get("bio") as string).trim();
  const tagline   = (formData.get("tagline") as string | null)?.trim() ?? null;
  const whatsapp  = (formData.get("whatsappPhone") as string | null)?.trim() ?? null;
  const heightCm  = formData.get("heightCm") ? Number(formData.get("heightCm")) : null;
  const dressSize = (formData.get("dressSize") as string | null)?.trim() || null;
  const hair      = (formData.get("hair") as string | null)?.trim() || null;
  const eyes      = (formData.get("eyes") as string | null)?.trim() || null;
  const languages = (formData.get("languages") as string | null)?.trim() || null;

  const servesMen    = formData.get("servesMen") === "on";
  const servesWomen  = formData.get("servesWomen") === "on";
  const servesCouples= formData.get("servesCouples") === "on";
  const hasOwnPlace  = formData.get("hasOwnPlace") === "on";
  const homeVisit    = formData.get("homeVisit") === "on";
  const travelsNational     = formData.get("travelsNational") === "on";
  const travelsInternational= formData.get("travelsInternational") === "on";

  if (!bio) return { error: "Escreva uma bio." };
  if (!citySlug) return { error: "Selecione uma cidade." };

  // Upsert city
  const city = await prisma.city.upsert({
    where: { slug: citySlug },
    update: {},
    create: {
      slug: citySlug,
      name: cityQuery || citySlug,
    },
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      bio,
      tagline: tagline || null,
      whatsappPhone: whatsapp || null,
      cityId: city.id,
      heightCm: heightCm && !isNaN(heightCm) ? heightCm : null,
      dressSize,
      hair,
      eyes,
      languages,
      servesMen,
      servesWomen,
      servesCouples,
      hasOwnPlace,
      homeVisit,
      travelsNational,
      travelsInternational,
    },
  });

  revalidatePath("/conta/onboarding/perfil");
  revalidatePath("/painel/perfil");
  revalidatePath(`/p/${profile.slug}`);

  // Only redirect when called from onboarding (not from painel)
  const fromOnboarding = formData.get("_from") !== "painel";
  if (fromOnboarding) redirect("/conta/onboarding/fotos");
  return { ok: true };
}

// ── Step 2: Fotos — add a photo by URL ───────────────────────────────────────
export async function addPhotoByUrl(formData: FormData) {
  const profile = await getProviderProfile();
  const url      = (formData.get("url") as string).trim();
  const isPublic = formData.get("isPublic") !== "false";

  if (!url) return { error: "URL inválida." };

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
  await prisma.media.deleteMany({ where: { id: mediaId, profileId: profile.id } });

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
  await prisma.media.updateMany({ where: { profileId: profile.id }, data: { isCover: false } });
  await prisma.media.updateMany({ where: { id: mediaId, profileId: profile.id }, data: { isCover: true } });
  revalidatePath("/conta/onboarding/fotos");
}

export async function updateMediaCaption(mediaId: string, caption: string) {
  const profile = await getProviderProfile();
  await prisma.media.updateMany({
    where: { id: mediaId, profileId: profile.id },
    data: { caption: caption.trim() || null },
  });
  revalidatePath("/painel/midias");
}

// ── Step 3: Valores ───────────────────────────────────────────────────────────
const DURATION_DEFS = [
  { key: "30min",    minutes: 30,   label: "30 min" },
  { key: "1h",       minutes: 60,   label: "1 hora" },
  { key: "2h",       minutes: 120,  label: "2 horas" },
  { key: "3h",       minutes: 180,  label: "3 horas" },
  { key: "4h",       minutes: 240,  label: "4 horas" },
  { key: "overnight",minutes: 720,  label: "Pernoite" },
  { key: "travel",   minutes: 1440, label: "Diária" },
] as const;

export async function saveOnboardingValores(formData: FormData) {
  const profile = await getProviderProfile();

  const paymentMethods = (formData.get("paymentMethods") as string | null)?.trim() || null;

  // Build active duration options from form
  const options: { minutes: number; label: string; priceBrl: number; sortOrder: number }[] = [];
  DURATION_DEFS.forEach((d, i) => {
    const enabled = formData.get(`enabled_${d.key}`) === "1";
    const price   = Number(formData.get(`price_${d.key}`));
    if (enabled && price > 0) {
      options.push({ minutes: d.minutes, label: d.label, priceBrl: price, sortOrder: i });
    }
  });

  const oneHour = options.find((o) => o.minutes === 60);
  if (!oneHour) return { error: "Informe o valor para 1 hora (obrigatório)." };

  const twoHours  = options.find((o) => o.minutes === 120);
  const overnight = options.find((o) => o.minutes === 720);
  const travel    = options.find((o) => o.minutes === 1440);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: {
        priceHour:      oneHour.priceBrl,
        priceTwoHours:  twoHours?.priceBrl  ?? null,
        priceOvernight: overnight?.priceBrl ?? null,
        priceTravelDay: travel?.priceBrl    ?? null,
        paymentMethods,
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
export async function publishProfile(_?: FormData): Promise<void> {
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

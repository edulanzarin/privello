"use server";

/**
 * Server Actions — Onboarding do acompanhante
 *
 * Caminho: src/app/_actions/onboarding.ts
 *
 * Cobre os 4 passos do onboarding do acompanhante:
 *   1. `saveOnboardingPerfil` — dados básicos, cidade, atributos, públicos.
 *   2. Fotos — `addPhotoByUrl`, `removePhoto`, `setCoverPhoto`,
 *      `updateMediaCaption`.
 *   3. `saveOnboardingValores` — durações + preços + métodos de pagamento.
 *   4. `publishProfile` — publica o perfil quando os pré-requisitos estão ok.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`OnboardingPerfilSchema`, `AddPhotoByUrlSchema`,
 *   `RemovePhotoSchema`, `SetCoverPhotoSchema`, `UpdateMediaCaptionSchema`,
 *   `OnboardingValoresSchema` em `src/lib/validation/onboarding.schema.ts`).
 * - Autenticação requerida via `auth()` + lookup de `Profile`; sem perfil →
 *   redirect para `/entrar`.
 * - Revalidação de cache via `revalidatePath` em `/conta/onboarding/*`,
 *   `/painel/perfil`, `/painel/midias` e `/p/<slug>`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.6
 * - src/lib/validation/onboarding.schema.ts
 */

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
/**
 * Salva os dados do passo 1 do onboarding (perfil) e segue para o passo 2 a
 * menos que o form venha do painel (`_from = "painel"`).
 *
 * @param formData - FormData com:
 *   - `cityQuery`, `citySlug` (string, required): cidade alvo (upsert por slug).
 *   - `bio`, `tagline?`, `whatsappPhone?`.
 *   - `heightCm?` (number coerced), `dressSize?`, `hair?`, `eyes?`, `languages?`.
 *   - Booleanos via checkbox (`"on"`): `servesMen`, `servesWomen`, `servesCouples`,
 *     `hasOwnPlace`, `homeVisit`, `travelsNational`, `travelsInternational`.
 *   - `_from?` (string): origem do form; se `"painel"`, não redireciona.
 * @returns `{ ok: true }` quando vem do painel ou `{ error, issues? }` em
 *   falha. No fluxo de onboarding, redireciona para `/conta/onboarding/fotos`.
 *
 * Side effects:
 * - `prisma.city.upsert` por slug.
 * - `prisma.profile.update` com os campos do schema.
 * - `revalidatePath("/conta/onboarding/perfil")`, `("/painel/perfil")`,
 *   `("/p/<slug>")`.
 *
 * @see src/lib/validation/onboarding.schema.ts (`OnboardingPerfilSchema`)
 */
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
/**
 * Anexa uma mídia (foto) ao perfil a partir de uma URL. A primeira foto pública
 * cadastrada é marcada como capa.
 *
 * @param formData - FormData com:
 *   - `url` (string, URL válida — `AddPhotoByUrlSchema`).
 *   - `isPublic?` (boolean coerced, default true).
 * @returns `{ ok: true }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - `prisma.media.create` (mídia ligada ao `profileId`).
 * - `revalidatePath("/conta/onboarding/fotos")`.
 *
 * @see src/lib/validation/onboarding.schema.ts (`AddPhotoByUrlSchema`)
 */
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

/**
 * Remove uma foto do perfil. Se a foto removida era capa, promove a próxima
 * pública (menor `sortOrder`) a capa.
 *
 * @param mediaId - cuid da `Media` (`RemovePhotoSchema`).
 * @returns `void` (silencioso em validation fail, mantém o contrato).
 *
 * Side effects:
 * - `prisma.media.deleteMany` filtrando por `profileId`.
 * - Possível `update` para remarcar a capa.
 * - `revalidatePath("/conta/onboarding/fotos")`.
 *
 * @see src/lib/validation/onboarding.schema.ts (`RemovePhotoSchema`)
 */
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

/**
 * Define a foto informada como capa do perfil, removendo o flag `isCover`
 * das demais.
 *
 * @param mediaId - cuid da `Media` (`SetCoverPhotoSchema`).
 * @returns `void`.
 *
 * Side effects:
 * - Dois `updateMany` em `Media`.
 * - `revalidatePath("/conta/onboarding/fotos")`.
 *
 * @see src/lib/validation/onboarding.schema.ts (`SetCoverPhotoSchema`)
 */
export async function setCoverPhoto(mediaId: string) {
  const profile = await getProviderProfile();
  const parsed = SetCoverPhotoSchema.safeParse({ mediaId });
  if (!parsed.success) return;
  await prisma.media.updateMany({ where: { profileId: profile.id }, data: { isCover: false } });
  await prisma.media.updateMany({ where: { id: parsed.data.mediaId, profileId: profile.id }, data: { isCover: true } });
  revalidatePath("/conta/onboarding/fotos");
}

/**
 * Atualiza a legenda de uma mídia do perfil.
 *
 * @param mediaId - cuid da `Media`.
 * @param caption - Texto trim, ≤500 chars (`UpdateMediaCaptionSchema`).
 *   String vazia é normalizada para `null`.
 * @returns `{ error, issues? }` apenas em validation fail; `void` em sucesso.
 *
 * Side effects:
 * - `prisma.media.updateMany` filtrado por `profileId`.
 * - `revalidatePath("/painel/midias")`.
 *
 * @see src/lib/validation/onboarding.schema.ts (`UpdateMediaCaptionSchema`)
 */
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

/**
 * Salva o passo 3 (valores e métodos de pagamento), persiste preços
 * agregados em `Profile` e recria a tabela de `ProfileDurationOption`.
 * Exige preço para 1 hora (60 min); redireciona ao próximo passo.
 *
 * @param formData - FormData com:
 *   - `paymentMethods?` (string).
 *   - Para cada `key` em `DURATION_DEFS` (30min, 1h, 2h, 3h, 4h, overnight,
 *     travel): `enabled_<key>` (=== `"1"`) e `price_<key>` (number > 0).
 * @returns `{ error, issues? }` em falha. Em sucesso, redireciona para
 *   `/conta/onboarding/publicar`.
 *
 * Side effects:
 * - `prisma.$transaction`:
 *   - `Profile.update` com `priceHour`, `priceTwoHours`, `priceOvernight`,
 *     `priceTravelDay`, `paymentMethods`.
 *   - `ProfileDurationOption.deleteMany` + `createMany` (recria do zero).
 * - `revalidatePath("/conta/onboarding/valores")`.
 *
 * @see src/lib/validation/onboarding.schema.ts (`OnboardingValoresSchema`)
 */
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
/**
 * Marca o perfil como publicado (`isOnline = true`) se os pré-requisitos
 * estão ok (bio, preço hora, foto de capa pública). Redireciona para o passo
 * pendente quando algo falta.
 *
 * Aceita FormData implicitamente (via `<form action={...}>`) mas não consome —
 * só checa estado da DB.
 *
 * @returns `void` (sempre redireciona).
 *
 * Side effects:
 * - `prisma.profile.update({ isOnline: true })` quando válido.
 * - `revalidatePath("/p/<slug>")`.
 * - Redirect para `/painel`, `/conta/onboarding/valores` ou
 *   `/conta/onboarding/fotos` conforme estado.
 */
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

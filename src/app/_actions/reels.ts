"use server";

/**
 * Server Actions — Reels do acompanhante
 *
 * Caminho: src/app/_actions/reels.ts
 *
 * Cobre criação, exclusão e toggle de privacidade de reels (`Media` do tipo
 * `REEL`) do perfil logado. Cada ação pertence ao acompanhante dono do perfil.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`CreateReelSchema`, `DeleteReelSchema`,
 *   `ToggleReelPrivacySchema` em `src/lib/validation/reels.schema.ts`).
 * - Autenticação requerida via `auth()`; sem sessão/perfil → redirect para
 *   `/entrar` ou `/conta/onboarding/perfil`.
 * - Revalidação de cache via `revalidatePath("/painel/reels")`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.8
 * - src/lib/validation/reels.schema.ts
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  CreateReelSchema,
  DeleteReelSchema,
  ToggleReelPrivacySchema,
  formDataToObject,
} from "@/lib/validation";

async function getProviderProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

/**
 * Cria um reel para o perfil logado.
 *
 * @param formData - FormData com:
 *   - `url` (string, URL válida).
 *   - `caption?` (string trim, ≤500 chars, nullable).
 *   - `isPrivate?` (boolean coerced, default false). Quando true, o reel é
 *     salvo com `isPublic = false`.
 * @returns `{ success: true }` em sucesso ou `{ error, issues? }` em falha.
 *
 * Side effects:
 * - `prisma.media.create` (`mediaType: "REEL"`, `sortOrder` = total atual).
 * - `revalidatePath("/painel/reels")`.
 *
 * @see src/lib/validation/reels.schema.ts (`CreateReelSchema`)
 */
export async function createReel(formData: FormData) {
  const profile = await getProviderProfile();
  const parsed = CreateReelSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { url, caption, isPrivate } = parsed.data;

  const count = await prisma.media.count({ where: { profileId: profile.id, mediaType: "REEL" } });

  await prisma.media.create({
    data: {
      profileId: profile.id,
      url,
      caption: caption ?? null,
      isPublic: !isPrivate,
      sortOrder: count,
      isCover: false,
      mediaType: "REEL",
    },
  });

  revalidatePath("/painel/reels");
  return { success: true };
}

/**
 * Remove um reel do perfil logado (filtra por `mediaType: "REEL"` e
 * `profileId` para evitar exclusão cruzada).
 *
 * @param mediaId - cuid da `Media` (`DeleteReelSchema`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.media.deleteMany`.
 * - `revalidatePath("/painel/reels")`.
 *
 * @see src/lib/validation/reels.schema.ts (`DeleteReelSchema`)
 */
export async function deleteReel(mediaId: string) {
  const profile = await getProviderProfile();
  const parsed = DeleteReelSchema.safeParse({ mediaId });
  if (!parsed.success) return;
  await prisma.media.deleteMany({ where: { id: parsed.data.mediaId, profileId: profile.id, mediaType: "REEL" } });
  revalidatePath("/painel/reels");
}

/**
 * Alterna a privacidade (`isPublic`) de um reel do perfil logado.
 *
 * @param mediaId - cuid da `Media` (`ToggleReelPrivacySchema`).
 * @returns `{ isPublic: boolean }` indicando o novo estado, ou
 *   `{ error, issues? }` quando o reel não existe ou validação falha.
 *
 * Side effects:
 * - `prisma.media.update({ isPublic: !current })`.
 * - `revalidatePath("/painel/reels")`.
 *
 * @see src/lib/validation/reels.schema.ts (`ToggleReelPrivacySchema`)
 */
export async function toggleReelPrivacy(mediaId: string) {
  const profile = await getProviderProfile();
  const parsed = ToggleReelPrivacySchema.safeParse({ mediaId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const reel = await prisma.media.findFirst({
    where: { id: parsed.data.mediaId, profileId: profile.id, mediaType: "REEL" },
    select: { id: true, isPublic: true },
  });
  if (!reel) return { error: "Reel não encontrado." };

  await prisma.media.update({
    where: { id: reel.id },
    data: { isPublic: !reel.isPublic },
  });

  revalidatePath("/painel/reels");
  return { isPublic: !reel.isPublic };
}

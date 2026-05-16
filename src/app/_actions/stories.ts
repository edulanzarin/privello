"use server";

/**
 * Server Actions — Stories do acompanhante (fluxo público)
 *
 * Caminho: src/app/_actions/stories.ts
 *
 * Cobre criação e exclusão de stories com expiração de 24 h. Disponível para
 * qualquer acompanhante logado. (As versões em `src/app/painel/_actions/`
 * cobrem o fluxo do painel, com gating de plano.)
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`CreateStorySchema`, `DeleteStorySchema` em
 *   `src/lib/validation/stories.schema.ts`).
 * - Autenticação requerida via `auth()`; sem perfil → redirect para onboarding.
 * - Falhas de validação são silenciosas (mantém contrato `void`).
 * - Revalidação de cache via `revalidatePath` em `/painel/perfil` e
 *   `/painel/stories`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.9
 * - src/lib/validation/stories.schema.ts
 * - src/app/painel/_actions/provider-settings.ts (variante com gating de plano)
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateStorySchema, DeleteStorySchema, formDataToObject } from "@/lib/validation";

async function getProviderProfile() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");
  return profile;
}

/**
 * Cria um story com expiração de 24 horas para o perfil logado.
 *
 * @param formData - FormData com:
 *   - `mediaUrl` (string, URL válida).
 *   - `caption?` (string trim, ≤500 chars, nullable).
 *   - `mediaType?` (`"IMAGE"` | `"VIDEO"`, default `IMAGE`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.story.create` com `expiresAt = now + 24h`.
 * - `revalidatePath("/painel/perfil")` e `revalidatePath("/painel/stories")`.
 *
 * @see src/lib/validation/stories.schema.ts (`CreateStorySchema`)
 */
export async function createStory(formData: FormData) {
  const profile = await getProviderProfile();
  const parsed = CreateStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;
  const { mediaUrl, caption, mediaType } = parsed.data;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.create({
    data: { profileId: profile.id, mediaUrl, mediaType, caption: caption ?? null, expiresAt },
  });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel/stories");
}

/**
 * Remove um story do perfil logado.
 *
 * @param formData - FormData com:
 *   - `storyId` (cuid — `DeleteStorySchema`).
 * @returns `void` (silencioso em validation fail).
 *
 * Side effects:
 * - `prisma.story.deleteMany` filtrado por `profileId`.
 * - `revalidatePath("/painel/perfil")` e `revalidatePath("/painel/stories")`.
 *
 * @see src/lib/validation/stories.schema.ts (`DeleteStorySchema`)
 */
export async function deleteStory(formData: FormData) {
  const profile = await getProviderProfile();
  const parsed = DeleteStorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;

  await prisma.story.deleteMany({ where: { id: parsed.data.storyId, profileId: profile.id } });

  revalidatePath("/painel/perfil");
  revalidatePath("/painel/stories");
}

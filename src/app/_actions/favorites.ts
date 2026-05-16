"use server";

/**
 * Server Actions — Favoritos do cliente
 *
 * Caminho: src/app/_actions/favorites.ts
 *
 * Cobre o toggle de favorito em perfis, a leitura do estado atual e a listagem
 * dos favoritos do usuário logado. O acompanhante não pode favoritar o próprio
 * perfil; sessões com JWT órfão (após reseed) são detectadas e tratadas.
 *
 * Convenções:
 * - Server actions Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`ToggleFavoriteSchema`, `GetFavoriteStatusSchema` em
 *   `src/lib/validation/favorites.schema.ts`).
 * - Autenticação requerida via `auth()`. `getClientFavorites` retorna `[]`
 *   quando não há sessão; `getFavoriteStatus` retorna `false`.
 * - Revalidação de cache via `revalidatePath("/conta/perfil")` em mutações.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.4
 * - src/lib/validation/favorites.schema.ts
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ToggleFavoriteSchema, GetFavoriteStatusSchema } from "@/lib/validation";

/**
 * Adiciona ou remove o perfil dos favoritos do usuário logado.
 *
 * @param profileId - cuid do `Profile` alvo (`ToggleFavoriteSchema`).
 * @returns `{ favorited: boolean }` indicando o novo estado, ou
 *   `{ error, issues? }` em falha (sem sessão, JWT obsoleto, auto-favorito
 *   ou input inválido).
 *
 * Side effects:
 * - Cria/remove `Favorite` no DB.
 * - `revalidatePath("/conta/perfil")` para refrescar a lista do cliente.
 *
 * @see src/lib/validation/favorites.schema.ts (`ToggleFavoriteSchema`)
 */
export async function toggleFavorite(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Faça login para curtir perfis." };

  const parsed = ToggleFavoriteSchema.safeParse({ profileId });
  if (!parsed.success) return { error: "Validation failed", issues: parsed.error.issues };
  const { profileId: pid } = parsed.data;

  // Prevent self-favoriting
  const viewerProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (viewerProfile?.id === pid) return { error: "Você não pode curtir seu próprio perfil." };

  const userId = session.user.id;

  // Guard against stale JWTs (e.g. after a DB re-seed)
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userExists) return { error: "Sessão expirada. Faça login novamente." };

  const existing = await prisma.favorite.findUnique({
    where: { userId_profileId: { userId, profileId: pid } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/conta/perfil");
    return { favorited: false };
  } else {
    await prisma.favorite.create({ data: { userId, profileId: pid } });
    revalidatePath("/conta/perfil");
    return { favorited: true };
  }
}

/**
 * Retorna se o usuário logado já favoritou o perfil informado. Mantém contrato
 * silencioso: qualquer falha de validação ou ausência de sessão devolve `false`.
 *
 * @param profileId - cuid do `Profile` (`GetFavoriteStatusSchema`).
 * @returns `boolean`.
 *
 * @see src/lib/validation/favorites.schema.ts (`GetFavoriteStatusSchema`)
 */
export async function getFavoriteStatus(profileId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  const parsed = GetFavoriteStatusSchema.safeParse({ profileId });
  if (!parsed.success) return false;
  const fav = await prisma.favorite.findUnique({
    where: { userId_profileId: { userId: session.user.id, profileId: parsed.data.profileId } },
  });
  return !!fav;
}

/**
 * Lista os favoritos do usuário logado com dados básicos do perfil (cidade,
 * bairro, foto de capa pública), ordenados por mais recente.
 *
 * @returns Array de `Favorite` com `profile` aninhado, ou `[]` se não houver
 *   sessão.
 */
export async function getClientFavorites() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      profile: {
        include: {
          city: { select: { name: true, slug: true } },
          district: { select: { name: true, slug: true } },
          media: {
            where: { isPublic: true, isCover: true },
            take: 1,
            select: { url: true, isCover: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

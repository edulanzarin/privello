"use server";

/**
 * Server Actions — Contagem de visualizações de perfil
 *
 * Caminho: src/app/_actions/track-view.ts
 *
 * Cobre o tracking de views em perfis públicos com proteção anti-spam:
 * - O dono do perfil nunca conta view no próprio perfil.
 * - O mesmo visitante (cookie `pv_<profileId>`) só conta uma view por perfil
 *   a cada 1 hora (`COOLDOWN_MS`).
 *
 * Convenções:
 * - Server action Next.js 16 (`"use server"` no topo).
 * - Validação via Zod (`TrackProfileViewSchema` em
 *   `src/lib/validation/track-view.schema.ts`).
 * - Contrato silencioso: nunca lança e nunca retorna — view tracking não pode
 *   quebrar a página pública. Falhas (auth, parse, DB) são engolidas.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §2.12
 * - src/lib/validation/track-view.schema.ts
 */

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TrackProfileViewSchema } from "@/lib/validation";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Increments view counts with anti-spam protection:
 * - Providers never count views on their own profile
 * - Same visitor (cookie-based) can only count once per hour per profile
 *
 * @param profileId - cuid do `Profile` alvo (`TrackProfileViewSchema`).
 * @returns `void`. Sempre silencioso, inclusive em parse fail.
 *
 * Side effects:
 * - Lê/escreve cookie `pv_<profileId>` (httpOnly, SameSite=Lax, maxAge=3600).
 * - `prisma.profile.update` incrementa `viewsThisMonth` e `viewsCurrentPeriod`.
 *
 * @see src/lib/validation/track-view.schema.ts (`TrackProfileViewSchema`)
 */
export async function trackProfileView(profileId: string) {
  try {
    // Validate input shape silently (action contract is silent on parse errors).
    const parsed = TrackProfileViewSchema.safeParse({ profileId });
    if (!parsed.success) return;
    const { profileId: pid } = parsed.data;

    const session = await auth();

    // Don't count if the viewer is the profile owner
    if (session?.user?.id) {
      const ownProfile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (ownProfile?.id === pid) return;
    }

    // Cookie-based cooldown: "pv_<profileId>" = timestamp of last view
    const jar = await cookies();
    const cookieKey = `pv_${pid}`;
    const lastView = jar.get(cookieKey)?.value;

    if (lastView) {
      const elapsed = Date.now() - parseInt(lastView, 10);
      if (elapsed < COOLDOWN_MS) return; // still in cooldown
    }

    // Set cookie for 1h
    jar.set(cookieKey, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    await prisma.profile.update({
      where: { id: pid },
      data: {
        viewsThisMonth: { increment: 1 },
        viewsCurrentPeriod: { increment: 1 },
      },
    });
  } catch {
    // Never throw — view tracking must never break the page
  }
}

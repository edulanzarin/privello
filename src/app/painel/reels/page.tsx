/**
 * Página RSC — Painel do provider: reels (vídeos curtos).
 *
 * Rota: `/painel/reels`.
 * Tipo: Server Component (manager é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lista de reels muda a cada upload).
 *
 * Lista mídias `mediaType: REEL` e delega gestão ao `ReelsManager`.
 *
 * Cross-refs:
 * - src/components/painel/reels-manager.tsx
 * - src/app/_actions/reels.ts
 * - src/app/api/upload/route.ts
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReelsManager } from "@/components/painel/reels-manager";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 27 (reels do provider).
export const dynamic = "force-dynamic";

export default async function PainelReelsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");

  const reels = await prisma.media.findMany({
    where: { profileId: profile.id, mediaType: "REEL"},
    orderBy: { sortOrder: "asc"},
    select: { id: true, url: true, caption: true, isPublic: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reels</h1>
        <p className="mt-1 text-md text-ink-dim">
          Vídeos curtos em formato vertical para destacar sua personalidade.
        </p>
      </div>
      <ReelsManager initialReels={reels} />
    </div>
  );
}

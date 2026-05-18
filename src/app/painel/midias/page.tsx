/**
 * Página RSC — Painel do provider: gerenciamento de mídias (fotos/vídeos).
 *
 * Rota: `/painel/midias`.
 * Tipo: Server Component (manager é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lista de `Media` muda a cada upload/edição).
 *
 * Carrega todas as `Media` (públicas e privadas) e delega manipulação
 * (upload, reorder, toggle público) ao `MidiasManager`.
 *
 * Cross-refs:
 * - src/app/painel/midias/midias-manager.tsx
 * - src/app/api/upload/route.ts
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MidiasManager } from "./midias-manager";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 26 (mídias do provider).
export const dynamic = "force-dynamic";

export default async function PainelMidiasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      slug: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  const serialize = (m: typeof profile.media[number]) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  });
  const publicMedia = profile.media.filter((m) => m.isPublic).map(serialize);
  const privateCount = profile.media.filter((m) => !m.isPublic).length;
  const privateMedia = profile.media.filter((m) => !m.isPublic).map(serialize);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Galeria
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
          Mídias
        </h1>
        <p className="mt-2 text-md text-ink-dim">
          Gerencie suas fotos, vídeos e reels. A primeira foto pública é a foto de perfil do anúncio.
        </p>
      </div>
      <MidiasManager
        publicMedia={publicMedia}
        privateMedia={privateMedia}
        privateCount={privateCount}
        profileSlug={profile.slug}
      />
    </div>
  );
}

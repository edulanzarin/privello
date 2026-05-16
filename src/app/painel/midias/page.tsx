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
        <h1 className="text-3xl font-semibold tracking-tight">Mídias</h1>
        <p className="mt-1 text-md text-muted">
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

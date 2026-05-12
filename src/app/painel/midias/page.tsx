import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MidiasManager } from "./midias-manager";

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

  const publicMedia  = profile.media.filter((m) => m.isPublic);
  const privateCount = profile.media.filter((m) => !m.isPublic).length;
  const privateMedia = profile.media.filter((m) => !m.isPublic);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mídias</h1>
        <p className="mt-1 text-sm text-muted">
          Gerencie suas fotos, vídeos e reels. A primeira foto pública é a capa do anúncio.
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

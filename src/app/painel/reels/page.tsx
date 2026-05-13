import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReelsManager } from "@/components/painel/reels-manager";

export const dynamic = "force-dynamic";

export default async function PainelReelsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/conta/onboarding/perfil");

  const reels = await prisma.media.findMany({
    where: { profileId: profile.id, mediaType: "REEL" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, url: true, caption: true, isPublic: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reels</h1>
        <p className="mt-1 text-sm text-muted">
          Vídeos curtos em formato vertical para destacar sua personalidade.
        </p>
      </div>
      <ReelsManager initialReels={reels} />
    </div>
  );
}

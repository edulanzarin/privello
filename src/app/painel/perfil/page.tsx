import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PerfilEditor } from "./perfil-editor";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 25 (editor de perfil do provider).
export const dynamic = "force-dynamic";

export default async function PainelPerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      city: true,
      media: { orderBy: { sortOrder: "asc" } },
      stories: {
        where: { expiresAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        include: { _count: { select: { views: true, likes: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Editar perfil</h1>
        <p className="mt-1 text-[14px] text-muted">
          Alterações são salvas imediatamente e refletem no seu anúncio público.
        </p>
      </div>
      <div className="max-w-xl mx-auto">
        <PerfilEditor
          profile={profile}
          cityName={profile.city?.name ?? ""}
          citySlug={profile.city?.slug ?? ""}
        />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PerfilEditor } from "./perfil-editor";

export const dynamic = "force-dynamic";

export default async function PainelPerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      city: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar perfil</h1>
        <p className="mt-1 text-sm text-muted">
          Alterações são salvas imediatamente e refletem no seu anúncio público.
        </p>
      </div>
      <PerfilEditor profile={profile} cityName={profile.city?.name ?? ""} citySlug={profile.city?.slug ?? ""} />
    </div>
  );
}

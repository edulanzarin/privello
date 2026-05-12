import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ValoresForm } from "./valores-form";

export const dynamic = "force-dynamic";

export default async function PainelValoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { durationOptions: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Valores e durações</h1>
        <p className="mt-1 text-sm text-muted">Ative as durações que você oferece e defina o valor de cada uma.</p>
      </div>
      <ValoresForm profile={profile} />
    </div>
  );
}

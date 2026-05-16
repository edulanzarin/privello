import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePhotoUploader } from "./photo-uploader";

export const dynamic = "force-dynamic";

export default async function OnboardingFotosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { media: { where: { isPublic: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!profile) redirect("/entrar");

  const coverPhoto = profile.media.find((m) => m.isCover);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <Link href="/" className="text-[17px] font-bold tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </Link>

        <h1 className="mt-8 text-[24px] font-semibold tracking-tight">
          Foto de perfil
        </h1>
        <p className="mt-2 text-[14px] text-muted">
          Escolha a foto que aparecerá como foto de perfil do seu anúncio. É obrigatória para ativar seu perfil.
        </p>

        {/* Clickable profile circle — opens file picker */}
        <div className="mt-8 flex justify-center">
          <ProfilePhotoUploader coverUrl={coverPhoto?.url ?? null} />
        </div>

        {/* CTA */}
        <div className="mt-8">
          {coverPhoto ? (
            <Link
              href="/painel/plano"
              className="inline-flex items-center justify-center rounded-full bg-coral px-8 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
            >
              Escolher plano →
            </Link>
          ) : (
            <span className="inline-block rounded-full bg-black/[0.06] px-8 py-3 text-[14px] font-medium text-muted cursor-not-allowed">
              Escolher plano →
            </span>
          )}
        </div>

        <p className="mt-4 text-[12px] text-muted">
          Você poderá adicionar mais fotos depois no painel.
        </p>
      </div>
    </div>
  );
}

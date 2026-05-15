import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setCoverPhoto } from "@/app/_actions/onboarding";
import { PhotoUploader } from "./photo-uploader";

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

        {/* Photo area */}
        <div className="mt-8 flex justify-center">
          {coverPhoto ? (
            <div className="relative">
              <div className="relative h-40 w-40 overflow-hidden rounded-full ring-2 ring-coral ring-offset-4 ring-offset-[#f5f5f7]">
                <Image src={coverPhoto.url} alt="Foto de perfil" fill className="object-cover" sizes="160px" />
              </div>
              <p className="mt-4 text-[13px] font-medium text-[#248a3d]">✓ Foto definida</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-black/[0.04] border-2 border-dashed border-black/[0.12]">
                <Camera className="h-10 w-10 text-muted" strokeWidth={1.2} />
              </div>
              <p className="text-[13px] text-muted">Nenhuma foto enviada ainda</p>
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className="mt-6">
          <PhotoUploader isPublic={true} />
        </div>

        {/* If there are photos but none is cover, show them to select */}
        {profile.media.length > 0 && !coverPhoto && (
          <div className="mt-6">
            <p className="text-[12px] text-muted mb-3">Selecione uma como foto de perfil:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {profile.media.map((m) => (
                <form key={m.id} action={setCoverPhoto.bind(null, m.id)}>
                  <button type="submit" className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-black/[0.08] transition hover:ring-2 hover:ring-coral">
                    <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

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

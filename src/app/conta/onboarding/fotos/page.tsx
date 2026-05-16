import Link from "next/link";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePhotoUploader } from "./photo-uploader";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 19 (onboarding/fotos autenticado, uploads).
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
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            privello<span className="text-coral">.</span>
          </Link>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">
            Foto de perfil
          </h1>
          <p className="mt-2 text-md text-muted">
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
                className="inline-flex items-center justify-center rounded-full bg-coral px-8 py-3 text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
              >
                Escolher plano →
              </Link>
            ) : (
              <span className="inline-block rounded-full bg-black/[0.06] px-8 py-3 text-md font-medium text-muted cursor-not-allowed">
                Escolher plano →
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-muted">
            Você poderá adicionar mais fotos depois no painel.
          </p>
        </div>
      </div>
    </ViewTransition>
  );
}

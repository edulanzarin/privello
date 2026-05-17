/**
 * Página RSC — Onboarding passo 02: foto de perfil — Design System v2.
 *
 * Rota: `/conta/onboarding/fotos`.
 * Tipo: Server Component (uploader é Client).
 * Auth: acompanhante (PROVIDER) — exige sessão e `Profile` próprio.
 * Cache: `force-dynamic` (lê `auth()` + `Profile`).
 *
 * Permite escolher a foto de capa que aparece no anúncio. Bloqueia avanço
 * para `/painel/plano` enquanto não houver capa.
 *
 * Cross-refs:
 *  - src/app/conta/onboarding/fotos/photo-uploader.tsx
 *  - src/app/api/upload/route.ts
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePhotoUploader } from "./photo-uploader";
import { Button } from "@/components/ui/button";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 19.
export const dynamic = "force-dynamic";

export default async function OnboardingFotosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      media: {
        where: { isPublic: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!profile) redirect("/entrar");

  const coverPhoto = profile.media.find((m) => m.isCover);

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-[-0.025em] text-ink"
          >
            privello<span className="text-rose">.</span>
          </Link>

          <p className="mt-8 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Passo 02 de 04
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Foto de perfil
          </h1>
          <p className="mt-3 text-md leading-relaxed text-ink-dim">
            Escolha a foto que aparecerá como foto de perfil do seu anúncio. É
            obrigatória para ativar seu perfil.
          </p>

          <div className="mt-8 flex justify-center">
            <ProfilePhotoUploader coverUrl={coverPhoto?.url ?? null} />
          </div>

          <div className="mt-8">
            {coverPhoto ? (
              <Button
                href="/painel/plano"
                variant="primary"
                size="lg"
                className="min-w-[200px]"
              >
                Escolher plano →
              </Button>
            ) : (
              <span className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-xl border border-line bg-line/40 px-8 py-3 text-md font-medium text-ink-faint">
                Escolher plano →
              </span>
            )}
          </div>

          <p className="mt-4 text-sm text-ink-dim">
            Você poderá adicionar mais fotos depois no painel.
          </p>
        </div>
      </div>
    </ViewTransition>
  );
}

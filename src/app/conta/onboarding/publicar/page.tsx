/**
 * Página RSC — Onboarding passo 04: revisão e publicação — Design System v2.
 *
 * Rota: `/conta/onboarding/publicar`.
 * Tipo: Server Component (form de publicação é server action).
 * Auth: acompanhante (PROVIDER) — exige sessão e `Profile` próprio.
 * Cache: `force-dynamic` (lê `auth()` + `Profile`).
 *
 * Checklist de itens obrigatórios + preview do card; o botão de publicar só é
 * habilitado quando todos os itens estão `ok`.
 *
 * Cross-refs:
 *  - src/app/_actions/onboarding.ts (publishProfile)
 *  - src/components/onboarding/onboarding-sidebar.tsx
 */
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/ui/price-tag";
import { publishProfile } from "@/app/_actions/onboarding";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 20.
export const dynamic = "force-dynamic";

export default async function OnboardingPublicarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      city: true,
      media: { where: { isPublic: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) redirect("/entrar");

  const hasCoverPhoto = profile.media.some((m) => m.isCover);
  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];

  const checks = [
    {
      label: "Bio preenchida",
      ok: profile.bio.length > 10,
      href: "/conta/onboarding/perfil",
    },
    {
      label: "Cidade definida",
      ok: !!profile.cityId,
      href: "/conta/onboarding/perfil",
    },
    {
      label: "WhatsApp cadastrado",
      ok: !!profile.whatsappPhone,
      href: "/conta/onboarding/perfil",
    },
    {
      label: "Valor por hora",
      ok: profile.priceHour > 0,
      href: "/conta/onboarding/valores",
    },
    {
      label: "Foto de perfil definida",
      ok: hasCoverPhoto,
      href: "/conta/onboarding/fotos",
    },
  ];

  const allOk = checks.every((c) => c.ok);

  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      <div className="flex min-h-screen flex-col md:flex-row">
        <OnboardingSidebar current="publicar" />
        <main className="flex-1 px-6 py-10 md:px-14">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
            Passo 04 de 04
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Publicar perfil<span className="text-rose">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-dim">
            Revise as informações antes de publicar. Você pode editar tudo
            depois no painel.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* Checklist */}
            <div className="space-y-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                Checklist
              </p>
              {checks.map((c) => (
                <Card
                  key={c.label}
                  variant="solid"
                  padding="sm"
                  className="flex items-center gap-3"
                >
                  {c.ok ? (
                    <CheckCircle
                      className="h-5 w-5 shrink-0 text-success"
                      strokeWidth={2}
                    />
                  ) : (
                    <AlertCircle
                      className="h-5 w-5 shrink-0 text-rose"
                      strokeWidth={2}
                    />
                  )}
                  <span
                    className={`text-sm font-medium ${c.ok ? "text-ink" : "text-rose"
                      }`}
                  >
                    {c.label}
                  </span>
                  {!c.ok && (
                    <Link
                      href={c.href}
                      className="ml-auto text-xs font-semibold text-rose hover:underline"
                    >
                      Preencher →
                    </Link>
                  )}
                </Card>
              ))}
            </div>

            {/* Preview card */}
            <Card variant="solid" padding="md">
              <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                Preview
              </p>
              {cover && (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-line">
                  <Image
                    src={cover.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
              )}
              <div className="mt-3">
                <p className="text-md font-bold text-ink">
                  {profile.displayName}
                  <span className="ml-1 text-sm font-medium text-ink-dim">
                    {profile.age}
                  </span>
                </p>
                <p className="text-sm text-ink-dim">{profile.city?.name}</p>
                {profile.priceHour > 0 && (
                  <div className="mt-1.5">
                    <PriceTag
                      value={profile.priceHour}
                      variant="inline"
                      period="hora"
                      periodFormat="short"
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              href="/conta/onboarding/valores"
              variant="outline"
              size="lg"
            >
              ← Voltar
            </Button>
            <form action={publishProfile}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!allOk}
                className="min-h-[44px] min-w-[240px]"
              >
                {allOk ? "Publicar perfil" : "Complete os itens acima"}
              </Button>
            </form>
          </div>

          {!allOk && (
            <p className="mt-4 text-xs text-ink-dim">
              Complete todos os itens do checklist para publicar.
            </p>
          )}
        </main>
      </div>
    </ViewTransition>
  );
}

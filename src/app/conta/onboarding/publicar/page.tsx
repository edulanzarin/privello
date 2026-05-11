import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { publishProfile } from "@/app/_actions/onboarding";
import { formatBrl } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OnboardingPublicarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      city: true,
      media: { where: { isPublic: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!profile) redirect("/entrar");

  const checks = [
    { label: "Bio preenchida",       ok: profile.bio.length > 10 },
    { label: "Cidade definida",      ok: !!profile.cityId },
    { label: "WhatsApp cadastrado",  ok: !!profile.whatsappPhone },
    { label: "Valor por hora",       ok: profile.priceHour > 0 },
    { label: "Ao menos 1 foto",      ok: profile.media.length > 0 },
  ];

  const allOk = checks.every((c) => c.ok);
  const cover = profile.media[0];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <OnboardingSidebar current="publicar" />
      <main className="flex-1 bg-background px-6 py-10 md:px-14">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Passo 04 de 04</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Publicar perfil<span className="text-coral">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Revise as informações antes de publicar. Você pode editar tudo depois no painel.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Checklist */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Checklist</p>
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-3 border border-line bg-white px-4 py-3">
                {c.ok
                  ? <CheckCircle className="h-5 w-5 shrink-0 text-success" strokeWidth={1.5} />
                  : <AlertCircle className="h-5 w-5 shrink-0 text-coral" strokeWidth={1.5} />
                }
                <span className={`text-sm ${c.ok ? "" : "text-coral"}`}>{c.label}</span>
                {!c.ok && (
                  <Link href="/conta/onboarding/perfil" className="ml-auto text-xs underline text-muted">
                    Preencher
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Preview card */}
          <div className="border border-line bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">Preview</p>
            {cover && (
              <div className="relative aspect-[3/4] w-full bg-line overflow-hidden">
                <Image src={cover.url} alt="" fill className="object-cover" sizes="320px" />
              </div>
            )}
            <div className="mt-3">
              <p className="font-bold">{profile.displayName}, {profile.age}</p>
              <p className="text-sm text-muted">{profile.city?.name}</p>
              {profile.priceHour > 0 && (
                <p className="mt-1 text-sm font-bold text-coral">{formatBrl(profile.priceHour)} /h</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link href="/conta/onboarding/valores" className="border border-line bg-white px-6 py-3 text-sm">
            ← Voltar
          </Link>
          <form action={publishProfile}>
            <button
              type="submit"
              disabled={!allOk}
              className="bg-coral px-10 py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allOk ? "Publicar perfil" : "Complete os itens acima"}
            </button>
          </form>
        </div>

        {!allOk && (
          <p className="mt-4 text-xs text-muted">
            Complete todos os itens do checklist para publicar.
          </p>
        )}
      </main>
    </div>
  );
}

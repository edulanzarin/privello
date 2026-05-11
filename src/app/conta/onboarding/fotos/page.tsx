import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Lock, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { PhotoUploader } from "./photo-uploader";
import { setCoverPhoto, removePhoto } from "@/app/_actions/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingFotosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
  if (!profile) redirect("/entrar");

  const publicPhotos  = profile.media.filter((m) => m.isPublic);
  const privatePhotos = profile.media.filter((m) => !m.isPublic);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <OnboardingSidebar current="fotos" />

      <main className="flex-1 bg-background px-6 py-10 md:px-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Passo 02 de 04</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Suas fotos<span className="text-coral">.</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Faça upload das suas fotos. Após enviar, escolha qual será a capa do seu anúncio.
        </p>

        {/* ── Fotos públicas ── */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-7 w-7 items-center justify-center bg-foreground">
              <Star className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold">Fotos públicas · {publicPhotos.length}</p>
              <p className="text-xs text-muted">Visíveis para todos. Escolha uma como capa.</p>
            </div>
          </div>

          {/* Alert */}
          <div className="mb-5 border-l-4 border-coral bg-coral/5 px-4 py-3 text-xs text-coral">
            <strong>Atenção:</strong> Fotos públicas não podem conter nudez explícita. Lingerie, biquíni e roupas sensuais são permitidos. Conteúdo explícito deve ir para a galeria privada.
          </div>

          <div className="flex flex-wrap gap-3">
            {publicPhotos.map((m) => (
              <div key={m.id} className={`group relative h-32 w-32 overflow-hidden border-2 ${m.isCover ? "border-coral" : "border-line"} bg-line`}>
                <Image src={m.url} alt="" fill className="object-cover" sizes="128px" />

                {/* Cover badge */}
                {m.isCover && (
                  <span className="absolute left-0 top-0 bg-coral px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    Capa
                  </span>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover:opacity-100">
                  {!m.isCover && (
                    <form action={setCoverPhoto.bind(null, m.id)}>
                      <button type="submit" className="w-24 bg-coral py-1 text-[10px] font-bold uppercase text-white">
                        Definir capa
                      </button>
                    </form>
                  )}
                  <form action={removePhoto.bind(null, m.id)}>
                    <button type="submit" className="w-24 border border-white/50 py-1 text-[10px] font-semibold uppercase text-white hover:bg-white/10">
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            ))}
            <PhotoUploader isPublic={true} />
          </div>

          {publicPhotos.length > 0 && !publicPhotos.some((m) => m.isCover) && (
            <p className="mt-3 text-xs text-coral">Passe o mouse sobre uma foto e clique em "Definir capa".</p>
          )}
        </section>

        {/* ── Fotos privadas ── */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-7 w-7 items-center justify-center bg-sidebar">
              <Lock className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold">Galeria privada · {privatePhotos.length}</p>
              <p className="text-xs text-muted">Fotos e vídeos privados e explícitos — visíveis apenas para assinantes do site.</p>
            </div>
          </div>

          <div className="mb-5 border-l-4 border-sidebar bg-sidebar/5 px-4 py-3 text-xs text-foreground/70">
            Aqui você pode postar conteúdo explícito. O acesso é exclusivo para clientes que assinam a plataforma Privello — você não precisa gerenciar quem vê.
          </div>

          <div className="flex flex-wrap gap-3">
            {privatePhotos.map((m) => (
              <div key={m.id} className="group relative h-32 w-32 overflow-hidden border border-line bg-line">
                <Image src={m.url} alt="" fill className="object-cover" sizes="128px" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <form action={removePhoto.bind(null, m.id)}>
                    <button type="submit" className="border border-white/50 px-3 py-1 text-[10px] font-semibold uppercase text-white hover:bg-white/10">
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            ))}
            <PhotoUploader isPublic={false} />
          </div>
        </section>

        {/* ── Diretrizes ── */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="border border-line bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Fotos públicas ✓</p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted">
              <li>✓ Lingerie, biquíni, roupas sensuais</li>
              <li>✓ Fotos de rosto, corpo inteiro</li>
              <li>✓ Fotos atuais (últimos 6 meses)</li>
              <li>✗ Nudez explícita ou atos sexuais</li>
              <li>✗ Rostos de terceiros ou menores</li>
              <li>✗ Marca d&apos;água de outros sites</li>
            </ul>
          </div>
          <div className="border border-sidebar/20 bg-sidebar/5 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Galeria privada ✓</p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted">
              <li>✓ Conteúdo explícito permitido</li>
              <li>✓ Fotos e vídeos sensuais</li>
              <li>✓ Acesso exclusivo para assinantes</li>
              <li>✗ Menores de idade em qualquer contexto</li>
              <li>✗ Terceiros sem consentimento</li>
            </ul>
          </div>
        </section>

        <div className="mt-10 flex items-center justify-between">
          <Link href="/conta/onboarding/perfil" className="border border-line bg-white px-6 py-3 text-sm font-medium transition hover:border-foreground">
            ← Voltar
          </Link>
          <Link
            href="/conta/onboarding/valores"
            className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90"
          >
            Continuar →
          </Link>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingSidebar } from "@/components/onboarding/onboarding-sidebar";
import { PhotoUploader } from "./photo-uploader";

export const dynamic = "force-dynamic";

export default async function OnboardingFotosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!profile) redirect("/entrar");

  const publicPhotos  = profile.media.filter((m) => m.isPublic);
  const privatePhotos = profile.media.filter((m) => !m.isPublic);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <OnboardingSidebar current="fotos" />
      <main className="flex-1 bg-background px-6 py-10 md:px-14">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Passo 02 de 04</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Suas fotos<span className="text-coral">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Adicione a URL das suas fotos. A primeira foto pública será a capa do anúncio.
        </p>

        {/* Public photos */}
        <section className="mt-10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Fotos públicas · {publicPhotos.length}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {publicPhotos.map((m) => (
              <div key={m.id} className="relative h-28 w-28 border border-line bg-line overflow-hidden">
                <Image src={m.url} alt="" fill className="object-cover" sizes="112px" />
                {m.isCover && (
                  <span className="absolute left-1 top-1 bg-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Capa
                  </span>
                )}
                <PhotoActions mediaId={m.id} isCover={m.isCover} />
              </div>
            ))}
            <PhotoUploader isPublic={true} />
          </div>
        </section>

        {/* Private photos */}
        <section className="mt-10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Fotos privadas · {privatePhotos.length}
          </p>
          <p className="mt-1 text-xs text-muted">Visíveis apenas para clientes que você liberar.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {privatePhotos.map((m) => (
              <div key={m.id} className="relative h-28 w-28 border border-line bg-line overflow-hidden">
                <Image src={m.url} alt="" fill className="object-cover" sizes="112px" />
                <PhotoActions mediaId={m.id} isCover={false} />
              </div>
            ))}
            <PhotoUploader isPublic={false} />
          </div>
        </section>

        {/* Guidelines */}
        <section className="mt-10 border border-line bg-white p-5 text-sm text-muted">
          <p className="font-semibold text-foreground">Diretrizes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            <li>Fotos atuais (últimos 6 meses), sem marca d&apos;água de terceiros.</li>
            <li>Sem rostos de terceiros ou menores de idade.</li>
            <li>Fotos públicas sem nudez explícita.</li>
          </ul>
        </section>

        <div className="mt-10 flex items-center justify-between">
          <Link href="/conta/onboarding/perfil" className="border border-line bg-white px-6 py-3 text-sm">
            ← Voltar
          </Link>
          <Link href="/conta/onboarding/valores" className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white">
            Continuar →
          </Link>
        </div>
      </main>
    </div>
  );
}

// Server component for photo action buttons
function PhotoActions({ mediaId, isCover }: { mediaId: string; isCover: boolean }) {
  return (
    <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/50 px-1 py-0.5">
      {!isCover && (
        <form action={async () => {
          "use server";
          const { setCoverPhoto } = await import("@/app/_actions/onboarding");
          await setCoverPhoto(mediaId);
        }}>
          <button type="submit" className="text-[9px] text-white/80 hover:text-white">capa</button>
        </form>
      )}
      <form action={async () => {
        "use server";
        const { removePhoto } = await import("@/app/_actions/onboarding");
        await removePhoto(mediaId);
      }} className="ml-auto">
        <button type="submit" className="text-[9px] text-white/80 hover:text-coral">×</button>
      </form>
    </div>
  );
}

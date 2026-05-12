import { redirect } from "next/navigation";
import { Trash2, Eye, Heart, Clock, Diamond, ImagePlus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStory, deleteStory } from "@/app/painel/_actions/provider-settings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PainelStoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, planTier: true },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  if (profile.planTier !== "DESTAQUE" && profile.planTier !== "PREMIUM") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <Diamond className="h-10 w-10 text-coral" strokeWidth={1} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stories</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Stories estão disponíveis nos planos <strong>Plus</strong> e <strong>Premium</strong>. Apareça nas bolinhas acima das buscas e conquiste mais visualizações.
          </p>
        </div>
        <Link
          href="/painel/plano"
          className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-coral/90 transition"
        >
          Fazer upgrade
        </Link>
      </div>
    );
  }

  const now = new Date();
  const stories = await prisma.story.findMany({
    where: { profileId: profile.id },
    include: {
      _count: { select: { views: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const activeStories = stories.filter((s) => new Date(s.expiresAt) > now);
  const expiredStories = stories.filter((s) => new Date(s.expiresAt) <= now);

  function timeLeft(exp: Date) {
    const ms = new Date(exp).getTime() - now.getTime();
    if (ms <= 0) return "Expirado";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m restantes`;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Painel</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Stories</h1>
        <p className="mt-1 text-sm text-muted">
          Cada story dura 24h e aparece nas bolinhas da página de busca.
        </p>
      </div>

      {/* Upload form */}
      <div className="border border-line bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-muted" strokeWidth={1.5} />
          <p className="font-semibold">Publicar novo story</p>
        </div>
        <form action={async (fd) => { await createStory(fd); }} className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              URL da imagem
            </label>
            <input
              name="mediaUrl"
              required
              placeholder="https://..."
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
            <p className="mt-1 text-[10px] text-muted">
              Em breve: upload direto. Por enquanto, cole a URL de uma imagem hospedada.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
              Legenda (opcional)
            </label>
            <input
              name="caption"
              placeholder="Uma frase sobre o momento..."
              maxLength={150}
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </div>
          <button
            type="submit"
            className="bg-coral px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-coral/90 transition"
          >
            Publicar story
          </button>
        </form>
      </div>

      {/* Active stories */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">
          Ativos · {activeStories.length}
        </p>
        {activeStories.length === 0 ? (
          <p className="text-sm text-muted">Nenhum story ativo. Publique um acima.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeStories.map((s) => (
              <div key={s.id} className="relative border border-line bg-white overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mediaUrl} alt="" className="h-48 w-full object-cover" />
                <div className="p-4 space-y-2">
                  {s.caption && <p className="text-sm italic text-muted line-clamp-2">{s.caption}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {s._count.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {s._count.likes} curtidas
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {timeLeft(s.expiresAt)}
                    </span>
                  </div>
                  <form action={deleteStory}>
                    <input type="hidden" name="storyId" value={s.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-[11px] text-muted hover:text-coral transition"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                      Remover
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expired */}
      {expiredStories.length > 0 && (
        <details className="border border-line bg-white">
          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Expirados · {expiredStories.length}
          </summary>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {expiredStories.slice(0, 9).map((s) => (
              <div key={s.id} className="border border-line bg-white/50 overflow-hidden opacity-60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.mediaUrl} alt="" className="h-36 w-full object-cover grayscale" />
                <div className="p-3 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {s._count.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {s._count.likes}</span>
                  <form action={deleteStory} className="ml-auto">
                    <input type="hidden" name="storyId" value={s.id} />
                    <button type="submit" className="hover:text-coral transition"><Trash2 className="h-3 w-3" /></button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

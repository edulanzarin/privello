import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoriesManager } from "./stories-manager";
import Link from "next/link";
import { Diamond } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PainelStoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      planTier: true,
      stories: {
        include: { _count: { select: { views: true, likes: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  if (profile.planTier !== "DESTAQUE" && profile.planTier !== "PREMIUM") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <Diamond className="h-10 w-10 text-coral" strokeWidth={1} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stories</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Stories estão disponíveis nos planos <strong>Plus</strong> e <strong>Premium</strong>.
            Apareça nas bolinhas acima das buscas e conquiste mais visualizações.
          </p>
        </div>
        <Link href="/painel/plano"
          className="rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-[0.97] transition">
          Fazer upgrade
        </Link>
      </div>
    );
  }

  const now = new Date();
  const activeStories  = profile.stories.filter((s) => new Date(s.expiresAt) > now);
  const expiredStories = profile.stories.filter((s) => new Date(s.expiresAt) <= now);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stories</h1>
        <p className="mt-1 text-sm text-muted">
          Cada story dura 24h e aparece nas bolinhas da página de busca. Igual ao Instagram.
        </p>
      </div>
      <StoriesManager
        activeStories={activeStories}
        expiredStories={expiredStories}
      />
    </div>
  );
}

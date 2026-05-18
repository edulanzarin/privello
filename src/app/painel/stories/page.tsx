/**
 * Página RSC — Painel do provider: stories (24h).
 *
 * Rota: `/painel/stories`.
 * Tipo: Server Component (manager é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`;
 *  feature-gate adicional: planos `DESTAQUE` ou `PREMIUM` (paywall caso contrário).
 * Cache: `force-dynamic` (stories ativos vs expirados por request).
 *
 * Carrega últimos 50 stories e separa em ativos (não-expirados) e expirados.
 *
 * Cross-refs:
 * - src/app/painel/stories/stories-manager.tsx
 * - src/app/_actions/stories.ts
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoriesManager } from "./stories-manager";
import Link from "next/link";
import { Diamond } from "lucide-react";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 28 (stories do provider).
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
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-soft">
          <Diamond className="h-8 w-8 text-rose" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
            Stories
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-md leading-relaxed text-ink-dim">
            Stories estão disponíveis nos planos{" "}
            <strong className="text-ink">Plus</strong> e{" "}
            <strong className="text-ink">Premium</strong>. Apareça nas bolinhas
            acima das buscas e conquiste mais visualizações.
          </p>
        </div>
        <Link
          href="/painel/plano"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose px-6 py-3 text-md font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Fazer upgrade
        </Link>
      </div>
    );
  }

  const now = new Date();
  const activeStories = profile.stories.filter((s) => new Date(s.expiresAt) > now);
  const expiredStories = profile.stories.filter((s) => new Date(s.expiresAt) <= now);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Conteúdo de 24h
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
          Stories
        </h1>
        <p className="mt-2 text-md text-ink-dim">
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

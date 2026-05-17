import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";

type SiteHeaderProps = {
  variant?: "default" | "minimal";
  activeHref?: string;
};

/**
 * Site header — Design System v2.2 (Tahoe Sensual, calibrado).
 *
 * Caminho: src/components/layout/site-header.tsx
 * Steering: `.kiro/steering/design-system.md` §13.2.
 *
 * Mobile (`< 768px`): h-14, glass sticky, **apenas logo** centralizado/à esquerda.
 *   Nav e ações vivem 100% no BottomNav flutuante (decisão user 2026-05-17 —
 *   hambúrguer drawer foi removido por ser redundante: o item "Entrar" do
 *   bottom-nav já leva para a página `/entrar` que tem login + criar conta).
 *
 * Desktop (`≥ 768px`): h-16, glass sticky, logo + ações (Entrar / Criar conta).
 *   Logged-in: avatar + handle (atalho pra perfil/painel).
 *
 * Nav inline (Acompanhantes/Reels/Planos) também REMOVIDA do desktop —
 * BottomNav cobre tudo em todos breakpoints.
 *
 * Server Component — busca handle/avatar via auth() + prisma.
 *
 * Props:
 *  - `variant?` (legado, sem efeito visual atual).
 *  - `activeHref?` (legado — desktop nav inline removida; sem destaque).
 */
export async function SiteHeader(_props: SiteHeaderProps = {}) {
  const session = await auth();

  let handle: string | null = null;
  let avatarUrl: string | null = null;
  let userName: string | null = null;

  if (session?.user?.id) {
    if (session.user.role === "PROVIDER") {
      const p = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: {
          slug: true,
          media: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      });
      handle = p?.slug ?? null;
      avatarUrl = p?.media?.[0]?.url ?? null;
    } else {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, image: true, name: true },
      });
      handle = u?.slug ?? null;
      avatarUrl = u?.image ?? null;
      userName = u?.name ?? null;
    }
  }

  const isLoggedIn = !!session;
  const isProvider = session?.user?.role === "PROVIDER";
  const profileHref = isProvider
    ? handle
      ? `/p/${handle}`
      : "/painel"
    : "/conta/perfil";

  return (
    <header className="glass sticky top-0 z-40">
      {/* Mobile bar — só logo. Nav + ações vivem no BottomNav. */}
      <div className="flex h-14 items-center justify-center px-4 md:hidden">
        <Link
          href={isProvider ? "/painel" : "/"}
          className="text-lg font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          privello<span className="text-rose">.</span>
        </Link>
      </div>

      {/* Desktop bar — logo + ações (Entrar / Criar conta). */}
      <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between px-6 md:flex lg:px-8">
        <Link
          href={isProvider ? "/painel" : "/"}
          className="text-xl font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          privello<span className="text-rose">.</span>
        </Link>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href={profileHref}
              className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar
                src={avatarUrl}
                alt={userName || handle || ""}
                fallback={userName || handle || undefined}
                size="sm"
              />
              <span className="hidden text-base font-semibold text-ink lg:inline">
                {handle ? `@${handle}` : session.user.name?.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/entrar"
                className="rounded-full px-4 py-2 text-base font-semibold text-ink-dim transition-colors hover:text-ink hover:bg-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-rose px-4 py-2 text-base font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

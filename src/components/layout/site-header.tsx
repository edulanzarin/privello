import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { SiteHeaderMobileMenu } from "./site-header-mobile-menu";

type SiteHeaderProps = {
  variant?: "default" | "minimal";
  activeHref?: string;
};

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/buscar", label: "Acompanhantes" },
  { href: "/reels", label: "Reels" },
  { href: "/planos", label: "Planos" },
];

/**
 * Site header — Design System v2.1 (Tahoe Sensual, calibrado).
 *
 * Caminho: src/components/layout/site-header.tsx
 * Steering: `.kiro/steering/design-system.md` §13.2.
 *
 * Mobile (`< 768px`): h-14, glass sticky, logo + hambúrguer drawer.
 * Desktop (`≥ 768px`): h-16, glass sticky, logo + ações (Entrar / Criar conta).
 *
 * Nav inline desktop foi REMOVIDA (decisão do user 2026-05-17): a BottomNav
 * pill flutuante é visível em todos breakpoints e cobre Home/Acompanhantes/
 * Reels/Perfil — sem duplicação no header.
 *
 * Logado: avatar + handle (atalho pra perfil/painel).
 * Anônimo: Entrar (ghost) + Criar conta (rose primary).
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
      {/* Mobile bar */}
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <Link
          href={isProvider ? "/painel" : "/"}
          className="text-lg font-bold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          privello<span className="text-rose">.</span>
        </Link>
        <SiteHeaderMobileMenu
          isLoggedIn={isLoggedIn}
          handle={handle}
          avatarUrl={avatarUrl}
          userName={userName}
          profileHref={profileHref}
          navLinks={NAV_LINKS}
        />
      </div>

      {/* Desktop bar — só logo + ações (nav vai pra BottomNav) */}
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

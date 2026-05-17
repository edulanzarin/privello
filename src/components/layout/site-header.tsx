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
 * Site header — Design System v2 (Tahoe Sensual).
 *
 * Steering: `.kiro/steering/design-system.md` §13.2.
 *
 * Mobile (`< 768px`): h-14, glass sticky, logo + hambúrguer drawer.
 *   Search NÃO aparece no header — vive no hero da home ou no header
 *   sticky de Descobrir.
 *
 * Desktop (`≥ 768px`): h-16, glass sticky, logo + nav inline + ações.
 *   Logado: avatar + handle (atalho pra perfil/painel).
 *   Anônimo: Entrar (ghost) + Criar conta (rose primary).
 *
 * Active link com pill `bg-rose-soft text-rose`.
 *
 * Server Component — busca handle/avatar via auth() + prisma.
 *
 * Props:
 *  - `variant?` (legado, sem efeito visual atual).
 *  - `activeHref?` (string): match exato ou prefixo p destacar nav item ativo em desktop.
 */
export async function SiteHeader({ activeHref }: SiteHeaderProps = {}) {
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

  function isActive(href: string): boolean {
    if (!activeHref) return false;
    if (href === "/") return activeHref === "/";
    return activeHref === href || activeHref.startsWith(href + "/");
  }

  return (
    <header className="glass sticky top-0 z-40">
      {/* Mobile bar */}
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <Link
          href={isProvider ? "/painel" : "/"}
          className="text-lg font-semibold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
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

      {/* Desktop bar */}
      <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between px-6 md:flex lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href={isProvider ? "/painel" : "/"}
            className="text-xl font-semibold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            privello<span className="text-rose">.</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "rounded-full px-3 py-1.5 text-base font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
                    (active
                      ? "bg-rose-soft text-rose"
                      : "text-ink-dim hover:text-ink hover:bg-line/40")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

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
              <span className="hidden text-base font-medium text-ink lg:inline">
                {handle ? `@${handle}` : session.user.name?.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/entrar"
                className="rounded-full px-4 py-1.5 text-base font-medium text-ink-dim transition-colors hover:text-ink hover:bg-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-rose px-4 py-1.5 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

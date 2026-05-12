import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SiteHeaderProps = {
  variant?: "default" | "minimal";
  activeHref?: string;
};

export async function SiteHeader({ variant = "default", activeHref }: SiteHeaderProps) {
  const session = await auth();

  let handle: string | null = null;
  if (session?.user?.id) {
    if (session.user.role === "PROVIDER") {
      const p = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { slug: true },
      });
      handle = p?.slug ?? null;
    } else {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true },
      });
      handle = u?.slug ?? null;
    }
  }

  const userLabel = handle
    ? `@${handle}`
    : session?.user?.name?.split(" ")[0] ?? null;

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-black tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-5 sm:flex">
          <Link href="/reels" className="text-xs font-semibold uppercase tracking-wider text-muted transition hover:text-foreground">
            Reels
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href={session?.user?.role === "PROVIDER" ? (handle ? `/p/${handle}` : "/painel") : "/conta/perfil"}
              className="hidden text-sm font-medium text-muted transition hover:text-foreground sm:inline"
            >
              {userLabel}
            </Link>
          ) : (
            <>
              <Link
                href="/entrar"
                className="px-4 py-2 text-xs font-semibold text-foreground transition hover:text-coral"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="bg-coral px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-coral/90"
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

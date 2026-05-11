import Link from "next/link";
import { auth } from "@/lib/auth";

type SiteHeaderProps = {
  variant?: "default" | "minimal";
};

export async function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="text-xl font-black tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session ? (
            <span className="hidden text-sm text-muted sm:inline">
              {session.user?.name?.split(" ")[0]}
            </span>
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

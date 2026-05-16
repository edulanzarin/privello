import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";

type SiteHeaderProps = {
  variant?: "default" | "minimal";
  activeHref?: string;
};

// `variant` e `activeHref` aceitos para compatibilidade com chamadas existentes (`<SiteHeader activeHref={...} />`).
// Atualmente o header não aplica visual diferente por variante nem destaque por aba — refactor visual fica fora do escopo da auditoria.
/**
 * Header sticky do site público (Server Component): logo "privello." e área
 * direita com avatar + handle (logado) ou botões "Entrar / Criar conta".
 * Para PROVIDER, o avatar/handle puxam do `Profile` (com cover); para CLIENT,
 * puxam do `User`.
 *
 * Props:
 * - `variant?` ("default" | "minimal"): aceito por compatibilidade — sem efeito visual atual.
 * - `activeHref?` (string): aceito por compatibilidade — sem destaque de aba implementado.
 *
 * Consumidores conhecidos:
 * - src/app/page.tsx
 * - src/app/p/[slug]/page.tsx
 * - src/app/descobrir/[citySlug]/page.tsx
 * - múltiplas outras páginas públicas (em-destaque, em-alta, planos, cidades, conta/perfil, novidades, not-found etc.)
 *
 * Side effects:
 * - `auth()` (NextAuth) lê a sessão atual.
 * - `prisma.profile.findUnique` ou `prisma.user.findUnique` para handle/avatar.
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
        select: { slug: true, media: { where: { isCover: true }, take: 1, select: { url: true } } },
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

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-background">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href={session?.user?.role === "PROVIDER" ? "/painel" : "/"} className="text-xl font-bold tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href={session?.user?.role === "PROVIDER" ? (handle ? `/p/${handle}` : "/painel") : "/conta/perfil"}
              className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-black/[0.04]"
            >
              <Avatar
                src={avatarUrl}
                alt={userName || handle || ""}
                fallback={userName || handle || undefined}
                size="xs"
              />
              <span className="hidden text-base font-medium text-foreground sm:inline">
                {handle ? `@${handle}` : session.user.name?.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/entrar"
                className="rounded-full px-4 py-1.5 text-base font-medium text-foreground transition-colors hover:bg-black/[0.04]"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-coral px-4 py-1.5 text-base font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.97]"
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

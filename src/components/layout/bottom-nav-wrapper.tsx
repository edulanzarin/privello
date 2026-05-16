import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "./bottom-nav";

/**
 * Server Component wrapper do `<BottomNav>` — lê a sessão do NextAuth e
 * resolve `providerSlug` quando o usuário é PROVIDER. Renderizado uma única vez
 * por request no `RootLayout`.
 *
 * Consumidores conhecidos:
 * - src/app/layout.tsx (root layout)
 *
 * Side effects:
 * - `auth()` (NextAuth) para ler a sessão atual.
 * - `prisma.profile.findUnique({ where: { userId } })` quando role é PROVIDER (busca slug).
 */
export async function BottomNavWrapper() {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "MODERATOR";

  let providerSlug: string | null = null;
  if (role === "PROVIDER" && session?.user?.id) {
    const p = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    });
    providerSlug = p?.slug ?? null;
  }

  return (
    <BottomNav
      isLoggedIn={!!session}
      userRole={role}
      isAdmin={isAdmin}
      providerSlug={providerSlug}
    />
  );
}

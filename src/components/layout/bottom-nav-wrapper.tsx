import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "./bottom-nav";

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

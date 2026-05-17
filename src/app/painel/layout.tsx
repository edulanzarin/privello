import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { ProviderHeartbeat } from "@/components/painel/provider-heartbeat";
import { ToastProvider } from "@/components/ui/toast";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 23 (layout autenticado).
export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/painel");

  // Clients don't have a provider profile — redirect them to home
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      displayName: true,
      slug: true,
      planTier: true,
      planExpiresAt: true,
      media: {
        where: { isPublic: true },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });
  if (!profile) redirect("/");

  let displayName = session.user.name ?? "Anunciante";
  let profileSlug = "";
  try {
    if (profile?.displayName) displayName = profile.displayName;
    if (profile?.slug) profileSlug = profile.slug;
  } catch { /* offline */ }

  const hasPlan = profile.planExpiresAt != null && new Date(profile.planExpiresAt) > new Date();

  return (
    <ToastProvider>
      <ProviderHeartbeat />
      <div className="min-h-screen bg-background text-foreground">
        <PainelSidebar
          displayName={displayName}
          profileSlug={profileSlug}
          planTier={profile.planTier}
          hasPlan={hasPlan}
          handle={profile.slug || undefined}
          avatarUrl={profile.media[0]?.url ?? null}
        >
          <div className="px-4 py-8 pb-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </div>
        </PainelSidebar>
      </div>
    </ToastProvider>
  );
}

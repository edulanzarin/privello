import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { ProviderHeartbeat } from "@/components/painel/provider-heartbeat";
import { ToastProvider } from "@/components/ui/toast";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  return (
    <ToastProvider>
      <ProviderHeartbeat />
      <div className="min-h-screen bg-background text-foreground">
        <PainelSidebar displayName={displayName} profileSlug={profileSlug} planTier={profile.planTier} handle={profile.slug || undefined} avatarUrl={profile.media[0]?.url ?? null} />
        <div className="pt-14 md:pl-56 md:pt-0">
          <div className="px-4 py-8 pb-20 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}

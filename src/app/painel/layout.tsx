import { PainelSidebar } from "@/components/painel/painel-sidebar";
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
    select: { displayName: true, slug: true, planTier: true },
  });
  if (!profile) redirect("/");

  let displayName = session.user.name ?? "Anunciante";
  let profileSlug = "";
  try {
    if (profile?.displayName) displayName = profile.displayName;
    if (profile?.slug) profileSlug = profile.slug;
  } catch { /* offline */ }

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-foreground">
      <PainelSidebar displayName={displayName} profileSlug={profileSlug} />
      <div className="md:pl-56">
        <div className="px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import { getProfileBySlugForPainel } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  let displayName = "Anunciante";
  try {
    const p = await getProfileBySlugForPainel(DEMO_PROVIDER_SLUG);
    displayName = p?.displayName ?? p?.user?.name ?? displayName;
  } catch {
    /* offline DB */
  }

  return (
    /* -mb-16 cancels the global pb-16 on body so the sidebar reaches the bottom */
    <div className="min-h-screen bg-[#f4f4f2] text-foreground -mb-16">
      <PainelSidebar displayName={displayName} />
      <div className="md:pl-56">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

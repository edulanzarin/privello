import Link from "next/link";
import { auth } from "@/lib/auth";
import { listReels, getAllCities } from "@/lib/queries";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { ReelsCityFilter } from "@/components/reels/city-filter";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ cidade?: string }> };

export default async function ReelsPage({ searchParams }: PageProps) {
  const { cidade } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  // Resolve cityId from slug
  let cityId: string | undefined;
  let cityName: string | undefined;
  if (cidade) {
    const city = await prisma.city.findFirst({ where: { slug: cidade }, select: { id: true, name: true } });
    if (city) { cityId = city.id; cityName = city.name; }
  }

  const isClient = !!userId && session?.user?.role !== "PROVIDER";

  const { reels, hasMore, nextCursor } = await listReels({ cityId, limit: 10, userId: isClient ? userId : undefined });

  const cities = await getAllCities();

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Fixed top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 text-white/70 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold tracking-tight">privello<span className="text-coral">.</span></span>
        </Link>

        <div className="ml-auto">
          <ReelsCityFilter cities={cities} currentSlug={cidade} />
        </div>
      </div>

      {cityName && (
        <div className="fixed top-14 inset-x-0 z-40 flex justify-center">
          <span className="rounded-full bg-coral/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {cityName}
          </span>
        </div>
      )}

      <ReelsFeed
        initialReels={reels}
        hasMore={hasMore}
        nextCursor={nextCursor}
        isClient={isClient}
        cityId={cityId}
      />
    </div>
  );
}

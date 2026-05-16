import Link from "next/link";
import { auth } from "@/lib/auth";
import { listReels, getCitiesWithReels, getCityBySlug, isSubscriber } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { ReelsCityFilter } from "@/components/reels/city-filter";
import { ReelsCityRestorer } from "@/components/reels/city-restorer";
import { ArrowLeft } from "lucide-react";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 10 (reels lê auth() para userId).
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ cidade?: string }> };

export default async function ReelsPage({ searchParams }: PageProps) {
  const { cidade } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  let cityId: string | undefined;
  let cityName: string | undefined;
  if (cidade) {
    const city = await getCityBySlug(cidade);
    if (city) {
      cityId = city.id;
      const parts = city.slug.split("-");
      const uf = parts[parts.length - 1].toUpperCase();
      cityName = /^[A-Z]{2}$/.test(uf) ? `${city.name}, ${uf}` : city.name;
    }
  }

  const isClient = !!userId;

  let viewerIsSubscriber = false;
  let ownerId: string | undefined;
  if (userId) {
    const [subStatus, profile] = await Promise.all([
      isSubscriber(userId),
      prisma.profile.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    viewerIsSubscriber = subStatus;
    if (profile) ownerId = profile.id;
  }

  const { reels, hasMore, nextCursor } = await listReels({
    cityId, limit: 10,
    userId: isClient ? userId : undefined,
    viewerIsSubscriber,
    ownerId,
  });

  const cities = await getCitiesWithReels();

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

      {!cidade && <ReelsCityRestorer />}

      <ReelsFeed
        initialReels={reels}
        hasMore={hasMore}
        nextCursor={nextCursor}
        isClient={isClient}
        isSubscriber={viewerIsSubscriber}
        cityId={cityId}
      />
    </div>
  );
}

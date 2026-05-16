import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listReels, isSubscriber } from "@/lib/services";
import { ReelsFeed } from "@/components/reels/reels-feed";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 11 (reels/[slug] lê auth() para userId).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ProfileReelsPage({ params }: PageProps) {
  const { slug } = await params;

  const profile = await prisma.profile.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, displayName: true,
      city: { select: { name: true } },
      media: { where: { isCover: true }, take: 1, select: { url: true } },
    },
  });
  if (!profile) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const isClient = !!userId;

  let viewerIsSubscriber = false;
  let ownerId: string | undefined;
  if (userId) {
    const [subStatus, providerProfile] = await Promise.all([
      isSubscriber(userId),
      prisma.profile.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    viewerIsSubscriber = subStatus;
    if (providerProfile) ownerId = providerProfile.id;
  }

  const { reels, hasMore, nextCursor } = await listReels({
    profileId: profile.id,
    limit: 10,
    userId: isClient ? userId : undefined,
    viewerIsSubscriber,
    ownerId,
  });

  const coverUrl = profile.media[0]?.url ?? null;

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 px-4 py-3">
        <Link href={`/p/${slug}`} className="text-white/70 hover:text-white transition">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <Link href={`/p/${slug}`} className="flex items-center gap-2.5 hover:opacity-80 transition">
          {coverUrl ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/30">
              <Image src={coverUrl} alt="" fill className="object-cover" sizes="32px" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/10" />
          )}
          <div>
            <p className="text-sm font-bold leading-tight text-white">{profile.displayName}</p>
            <p className="text-xs text-white/50">{profile.city.name} · Reels</p>
          </div>
        </Link>
      </div>

      <ReelsFeed
        initialReels={reels}
        hasMore={hasMore}
        nextCursor={nextCursor}
        isClient={isClient}
        isSubscriber={viewerIsSubscriber}
        profileId={profile.id}
      />
    </div>
  );
}

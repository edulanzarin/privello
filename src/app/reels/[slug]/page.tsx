import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfileBySlug, listReels } from "@/lib/queries";
import { ReelsFeed } from "@/components/reels/reels-feed";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ProfileReelsPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getProfileBySlug(slug);
  if (!profile) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const isClient = !!userId && session?.user?.role !== "PROVIDER";

  const { reels, hasMore, nextCursor } = await listReels({
    profileId: profile.id,
    limit: 10,
    userId: isClient ? userId : undefined,
  });

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Fixed top bar */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 px-4 py-3">
        <Link
          href={`/p/${slug}`}
          className="flex items-center gap-2 text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold">{profile.displayName}</span>
        </Link>
        <span className="text-xs text-white/30">· Reels</span>
      </div>

      <ReelsFeed
        initialReels={reels}
        hasMore={hasMore}
        nextCursor={nextCursor}
        isClient={isClient}
        profileId={profile.id}
      />
    </div>
  );
}

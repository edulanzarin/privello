import type { PlanTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const profileCardInclude = {
  city: { select: { name: true, slug: true } },
  district: { select: { name: true, slug: true } },
  media: {
    where: { isPublic: true },
    orderBy: { sortOrder: "asc" as const },
    take: 4,
    select: { url: true, isCover: true },
  },
} satisfies Prisma.ProfileInclude;

export type ProfileCardPayload = Prisma.ProfileGetPayload<{ include: typeof profileCardInclude }>;

export async function getPlatformStats() {
  const [profiles, verified, cities] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { isVerified: true } }),
    prisma.city.count(),
  ]);
  const verifiedPct = profiles === 0 ? 0 : Math.round((verified / profiles) * 100);
  return { profiles, verified, cities, verifiedPct };
}

export async function getCityBySlug(slug: string) {
  // Try exact match first (e.g. "blumenau-sc")
  const exact = await prisma.city.findUnique({
    where: { slug },
    include: { districts: { orderBy: { name: "asc" } } },
  });
  if (exact) return exact;

  // Fallback: strip the last segment (state suffix) and try again.
  // Handles legacy slugs like "sao-paulo" when the URL has "sao-paulo-sp".
  const parts = slug.split("-");
  if (parts.length > 1) {
    const withoutState = parts.slice(0, -1).join("-");
    return prisma.city.findUnique({
      where: { slug: withoutState },
      include: { districts: { orderBy: { name: "asc" } } },
    });
  }

  return null;
}

/**
 * Derives a human-readable city name from a slug like "blumenau-sc" → "Blumenau, SC"
 * or "sao-paulo-sp" → "São Paulo, SP".
 * This is a best-effort display name used when the city doesn't exist in the DB yet.
 */
function cityNameFromSlug(slug: string): { displayName: string; uf: string } {
  const parts = slug.split("-");
  const uf = parts[parts.length - 1].toUpperCase();
  const cityParts = parts.slice(0, -1).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return { displayName: cityParts.join(" "), uf };
}

/**
 * Like getCityBySlug but creates the city on-the-fly if it doesn't exist.
 * This allows any Brazilian city to have a working discover page even before
 * any provider registers there.
 */
export async function getOrCreateCityBySlug(slug: string) {
  const existing = await getCityBySlug(slug);
  if (existing) return existing;

  // City not in DB — create it so the page can render (empty state)
  const { displayName, uf } = cityNameFromSlug(slug);
  const name = uf ? `${displayName}, ${uf}` : displayName;

  // Use upsert to avoid race conditions
  const city = await prisma.city.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
    include: { districts: { orderBy: { name: "asc" } } },
  });
  return city;
}

export type GenderFilter = "garotos" | "casais" | undefined;

export type DiscoverFilters = {
  gender?: GenderFilter;
  priceMin?: number;
  priceMax?: number;
  ageMin?: number;
  ageMax?: number;
  verifiedOnly?: boolean;
  onlineOnly?: boolean;
  hasOwnPlace?: boolean;
  homeVisit?: boolean;
  excludeProfileId?: string; // hide own profile from search results
};

export type ProfileSort = "relevance" | "price_asc" | "price_desc" | "rating";

export function sortProfileCards<T extends ProfileCardPayload>(profiles: T[], sort: ProfileSort): T[] {
  const copy = [...profiles];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.priceHour - b.priceHour);
    case "price_desc":
      return copy.sort((a, b) => b.priceHour - a.priceHour);
    case "rating":
    case "relevance":
      return copy.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
    default:
      return copy;
  }
}

const PLAN_ORDER: PlanTier[] = ["PREMIUM", "DESTAQUE", "ESSENCIAL"];

export function finalizeDiscoverOrder<T extends ProfileCardPayload>(profiles: T[], sort: ProfileSort): T[] {
  const inner: ProfileSort = sort === "relevance" ? "rating" : sort;
  const now = new Date();

  // Boosted profiles always come first, sorted by plan then views
  const boosted = profiles.filter((p) => p.featuredUntil != null && new Date(p.featuredUntil) > now);
  const rest    = profiles.filter((p) => !(p.featuredUntil != null && new Date(p.featuredUntil) > now));

  const sortedBoosted: T[] = [];
  for (const tier of PLAN_ORDER) {
    const g = boosted.filter((p) => p.planTier === tier);
    sortedBoosted.push(...sortProfileCards(g, inner));
  }

  const out: T[] = [...sortedBoosted];
  for (const tier of PLAN_ORDER) {
    const g = rest.filter((p) => p.planTier === tier);
    out.push(...sortProfileCards(g, inner));
  }
  return out;
}

export async function listProfilesForCity(cityId: string, filters: DiscoverFilters, sort: ProfileSort = "relevance") {
  const where: Prisma.ProfileWhereInput = { cityId };

  // Default: show profiles that serve men (garotas).
  // "garotos" = servesWomen, "casais" = servesCouples, default/undefined = servesMen
  if (filters.gender === "garotos") where.servesWomen = true;
  else if (filters.gender === "casais") where.servesCouples = true;
  else where.servesMen = true;

  if (filters.priceMin != null || filters.priceMax != null) {
    where.priceHour = {};
    if (filters.priceMin != null) where.priceHour.gte = filters.priceMin;
    if (filters.priceMax != null) where.priceHour.lte = filters.priceMax;
  }
  if (filters.ageMin != null || filters.ageMax != null) {
    where.age = {};
    if (filters.ageMin != null) where.age.gte = filters.ageMin;
    if (filters.ageMax != null) where.age.lte = filters.ageMax;
  }
  if (filters.verifiedOnly) where.isVerified = true;
  if (filters.onlineOnly) where.isOnline = true;
  if (filters.hasOwnPlace) where.hasOwnPlace = true;
  if (filters.homeVisit) where.homeVisit = true;
  if (filters.excludeProfileId) where.id = { not: filters.excludeProfileId };

  const profiles = await prisma.profile.findMany({
    where,
    include: profileCardInclude,
    orderBy: [{ lastUpdatedAt: "desc" }],
    take: 60,
  });

  return finalizeDiscoverOrder(profiles, sort);
}

export async function getProfileBySlug(slug: string) {
  return prisma.profile.findUnique({
    where: { slug },
    include: {
      city: true,
      district: true,
      media: { orderBy: { sortOrder: "asc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 12 },
      availabilityRules: { orderBy: [{ weekday: "asc" }] },
      durationOptions: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { minutes: "asc" }],
      },
    },
  });
}

export async function getPremiumWeekProfiles() {
  return prisma.profile.findMany({
    where: { planTier: { in: ["PREMIUM", "DESTAQUE"] } },
    include: profileCardInclude,
    orderBy: [{ featuredUntil: "desc" }, { ratingAvg: "desc" }],
    take: 8,
  });
}

/**
 * "Em alta da semana" — purely by viewsCurrentPeriod, no plan grouping.
 * Most viewed profiles this week, regardless of plan tier.
 */
export async function getHotProfiles(limit = 20) {
  const profiles = await prisma.profile.findMany({
    include: profileCardInclude,
    orderBy: { viewsCurrentPeriod: "desc" },
    take: limit,
  });
  return profiles;
}

/**
 * Profiles with an active boost (featuredUntil > now).
 * Ordered by plan tier then viewsCurrentPeriod.
 * Boost lasts 24h — after that they fall back into the normal ranking.
 */
export async function getBoostedProfiles(limit = 8) {
  const now = new Date();
  const profiles = await prisma.profile.findMany({
    where: { featuredUntil: { gt: now } },
    include: profileCardInclude,
    orderBy: { viewsCurrentPeriod: "desc" },
    take: limit * 3,
  });

  const out: typeof profiles = [];
  for (const tier of PLAN_ORDER) {
    const group = profiles
      .filter((p) => p.planTier === tier)
      .sort((a, b) => b.viewsCurrentPeriod - a.viewsCurrentPeriod);
    out.push(...group);
    if (out.length >= limit) break;
  }

  return out.slice(0, limit);
}

export async function getHotPeriodStart(): Promise<Date | null> {
  const cfg = await prisma.hotPeriodConfig.findUnique({ where: { id: "hot" } });
  return cfg?.startedAt ?? null;
}

export async function getAllCities() {
  return prisma.city.findMany({ orderBy: { name: "asc" } });
}

export async function getProfileBySlugForPainel(slug: string) {
  return prisma.profile.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, email: true } },
      city: true,
      district: true,
    },
  });
}

export async function listPendingMeetingRequests(profileId: string) {
  return prisma.meetingRequest.findMany({
    where: { profileId, status: "PENDING" },
    include: { client: { select: { name: true, verified: true, createdAt: true } } },
    orderBy: { expiresAt: "asc" },
  });
}

export async function listConfirmedAgenda(profileId: string, limit = 5) {
  const now = new Date();
  return prisma.meetingRequest.findMany({
    where: {
      profileId,
      status: "CONFIRMED",
      date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    },
    include: { client: { select: { name: true } } },
    orderBy: { date: "asc" },
    take: limit,
  });
}

export async function listWhatsAppClicksRecent(profileId: string, take = 8) {
  return prisma.whatsAppClick.findMany({
    where: { profileId },
    orderBy: { clickedAt: "desc" },
    take,
  });
}

export async function countWhatsAppClicksToday(profileId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.whatsAppClick.count({
    where: { profileId, clickedAt: { gte: start } },
  });
}

export type StoryGroup = {
  profileId: string;
  slug: string;
  displayName: string;
  coverUrl: string;
  allSeen: boolean;
  stories: {
    id: string;
    mediaUrl: string;
    mediaType: string;
    caption: string | null;
    createdAt: string;
    viewCount: number;
    likeCount: number;
    seenByMe: boolean;
    likedByMe: boolean;
  }[];
};

export async function listStoriesForCity(cityId: string, userId?: string): Promise<StoryGroup[]> {
  const now = new Date();
  const rawStories = await prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      profile: {
        cityId,
        planTier: { in: ["DESTAQUE", "PREMIUM"] },
      },
    },
    include: {
      profile: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          media: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
      _count: { select: { views: true, likes: true } },
      views: userId ? { where: { userId }, select: { id: true } } : false,
      likes: userId ? { where: { userId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by profile, keep profile order by most recent story
  const groups = new Map<string, StoryGroup>();
  for (const s of rawStories) {
    const pId = s.profile.id;
    if (!groups.has(pId)) {
      groups.set(pId, {
        profileId: pId,
        slug: s.profile.slug,
        displayName: s.profile.displayName,
        coverUrl: s.profile.media[0]?.url ?? "https://picsum.photos/seed/x/200/200",
        allSeen: false,
        stories: [],
      });
    }
    const g = groups.get(pId)!;
    const seenByMe = userId ? (s.views as { id: string }[]).length > 0 : false;
    const likedByMe = userId ? (s.likes as { id: string }[]).length > 0 : false;
    g.stories.push({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      createdAt: s.createdAt.toISOString(),
      viewCount: s._count.views,
      likeCount: s._count.likes,
      seenByMe,
      likedByMe,
    });
  }

  // Mark allSeen
  for (const g of groups.values()) {
    g.allSeen = g.stories.every((s) => s.seenByMe);
  }

  return Array.from(groups.values());
}

export async function listFinancialRecordsForMonth(profileId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return prisma.financialRecord.findMany({
    where: { profileId, occurredAt: { gte: start, lte: end } },
    orderBy: { occurredAt: "desc" },
  });
}

export async function listModerationQueue() {
  return prisma.verificationCase.findMany({
    orderBy: { waitingSince: "asc" },
    take: 80,
    include: {
      profile: {
        include: {
          city: { select: { name: true } },
          district: { select: { name: true } },
          media: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      },
    },
  });
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Portrait photos from picsum (800x1100)
const photoSeeds = [10,20,30,40,50,64,65,91,106,119,137,145,177,184,193,200,211,219,237,240];

// Public sample MP4s (short clips)
const videoUrls = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

async function main() {
  const profile = await prisma.profile.findUnique({ where: { slug: "eduarda" } });
  if (!profile) { console.error("Profile 'eduarda' not found"); process.exit(1); }

  console.log(`Found profile: ${profile.displayName} (${profile.id})`);

  // Clear existing media
  await prisma.media.deleteMany({ where: { profileId: profile.id } });
  console.log("Cleared existing media");

  const media: { profileId: string; url: string; mediaType: string; isPublic: boolean; sortOrder: number; isCover: boolean }[] = [];

  // 20 photos
  photoSeeds.forEach((seed, i) => {
    media.push({
      profileId: profile.id,
      url: `https://picsum.photos/seed/${seed}/800/1100`,
      mediaType: "IMAGE",
      isPublic: true,
      sortOrder: i,
      isCover: i === 0,
    });
  });

  // 10 videos
  videoUrls.forEach((url, i) => {
    media.push({
      profileId: profile.id,
      url,
      mediaType: "VIDEO",
      isPublic: true,
      sortOrder: i,
      isCover: false,
    });
  });

  await prisma.media.createMany({ data: media });
  console.log(`Created ${media.length} media items (20 photos + 10 videos)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

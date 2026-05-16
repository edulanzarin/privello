import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("s");
  if (!slug) return NextResponse.json({ exists: false });

  const profile = await prisma.profile.findUnique({
    where: { slug },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!profile });
}

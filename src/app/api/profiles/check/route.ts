import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();
  if (!slug) return NextResponse.json({ exists: false });
  const count = await prisma.profile.count({ where: { slug } });
  return NextResponse.json({ exists: count > 0 });
}

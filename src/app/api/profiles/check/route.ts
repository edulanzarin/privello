import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProfilesCheckQuerySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const result = ProfilesCheckQuerySchema.safeParse({
    slug: req.nextUrl.searchParams.get("slug"),
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const count = await prisma.profile.count({ where: { slug: result.data.slug } });
  return NextResponse.json({ exists: count > 0 });
}

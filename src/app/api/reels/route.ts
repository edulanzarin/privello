import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listReels } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const session = await auth();
  const p = req.nextUrl.searchParams;
  const data = await listReels({
    cityId:    p.get("cityId")    ?? undefined,
    profileId: p.get("profileId") ?? undefined,
    cursor:    p.get("cursor")    ?? undefined,
    limit:     p.get("limit")     ? Number(p.get("limit")) : 10,
    userId:    session?.user?.id  ?? undefined,
  });
  return NextResponse.json(data);
}

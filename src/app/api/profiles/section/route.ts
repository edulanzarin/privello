import { NextRequest, NextResponse } from "next/server";
import { getSectionProfiles } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") as "hot" | "boosted" | null;
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  if (type !== "hot" && type !== "boosted") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const { profiles, hasMore } = await getSectionProfiles(type, offset);
  return NextResponse.json({ profiles, hasMore });
}

import { NextRequest, NextResponse } from "next/server";
import { getSectionProfiles } from "@/lib/queries";
import { ProfilesSectionQuerySchema } from "@/lib/validation";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 43 (Route Handler com cursor pagination).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const result = ProfilesSectionQuerySchema.safeParse({
    type: req.nextUrl.searchParams.get("type"),
    offset: req.nextUrl.searchParams.get("offset") ?? undefined,
  });
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const { profiles, hasMore } = await getSectionProfiles(result.data.type, result.data.offset);
  return NextResponse.json({ profiles, hasMore });
}

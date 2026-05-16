import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WaClickBodySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

function resolveClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const parsed = WaClickBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten(), { status: 400 });
    }
    const { profileId, source } = parsed.data;

    // Rate limit: 10 clicks per (profileId, IP) per hour. On excess we
    // return 200 silently and SKIP the prisma write (per `rate-limits.md`
    // — silent to avoid leaking the limit and to keep the conversion
    // metric clean).
    const ip = resolveClientIp(req);
    const rl = await rateLimit(rateLimitConfigFor("waClick", `${profileId}:${ip}`));
    if (!rl.allowed) {
      return NextResponse.json({ ok: true });
    }

    const session = await auth();

    let visitor = "anônimo";
    let verified = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, name: true },
      });
      visitor = user?.slug ? `@${user.slug}` : (user?.name ?? "usuário");
      verified = true;
    }

    await prisma.whatsAppClick.create({
      data: {
        profileId,
        source,
        visitor,
        verified,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

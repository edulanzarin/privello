import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BairrosParamsSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const result = BairrosParamsSchema.safeParse(await params);
  if (!result.success) {
    return NextResponse.json(result.error.flatten(), { status: 400 });
  }

  const city = await prisma.city.findUnique({ where: { slug: result.data.slug } });
  if (!city) return NextResponse.json({ bairros: [] });

  const districts = await prisma.district.findMany({
    where: { cityId: city.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ bairros: districts });
}

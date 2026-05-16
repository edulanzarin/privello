import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const city = await prisma.city.findUnique({ where: { slug } });
  if (!city) return NextResponse.json({ bairros: [] });

  const districts = await prisma.district.findMany({
    where: { cityId: city.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ bairros: districts });
}

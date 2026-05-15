import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const cities = await prisma.city.findMany({
        where: { profiles: { some: {} } },
        select: { name: true, slug: true, _count: { select: { profiles: true } } },
        orderBy: { profiles: { _count: "desc" } },
        take: 5,
    });

    return NextResponse.json({
        cities: cities.map((c) => ({ slug: c.slug, label: c.name })),
    });
}

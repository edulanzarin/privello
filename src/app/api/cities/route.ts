import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
    const cities = await prisma.city.findMany({
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(
        { cities: cities.map((c) => ({ slug: c.slug, label: c.name })) },
        {
            headers: {
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
            },
        },
    );
}

// src/lib/services/stats.service.ts
//
// Wave 7.1 (Requirement 5.2) — `getPlatformStats` e `getHotPeriodStart`
// migrados de `src/lib/queries.ts` sem mudança de comportamento.
// Paridade verificada por teste co-localizado.

import { prisma } from "@/lib/prisma";

export type PlatformStats = {
    profiles: number;
    verified: number;
    cities: number;
    verifiedPct: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
    const [profiles, verified, cities] = await Promise.all([
        prisma.profile.count(),
        prisma.profile.count({ where: { isVerified: true } }),
        prisma.city.count(),
    ]);
    const verifiedPct =
        profiles === 0 ? 0 : Math.round((verified / profiles) * 100);
    return { profiles, verified, cities, verifiedPct };
}

export async function getHotPeriodStart(): Promise<Date | null> {
    const cfg = await prisma.hotPeriodConfig.findUnique({
        where: { id: "hot" },
    });
    return cfg?.startedAt ?? null;
}

// src/lib/services/whatsapp-click.service.ts
//
// Wave 7.3 (Requirement 5.2) — `listWhatsAppClicksRecent` e
// `countWhatsAppClicksToday` migrados de `src/lib/queries.ts` sem
// mudança de comportamento.

import { prisma } from "@/lib/prisma";

export async function listWhatsAppClicksRecent(profileId: string, take = 8) {
    return prisma.whatsAppClick.findMany({
        where: { profileId },
        orderBy: { clickedAt: "desc" },
        take,
    });
}

export async function countWhatsAppClicksToday(profileId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return prisma.whatsAppClick.count({
        where: { profileId, clickedAt: { gte: start } },
    });
}

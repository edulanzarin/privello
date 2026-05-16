// src/lib/services/financial.service.ts
//
// Wave 7.5 (Requirement 5.2) — `listFinancialRecordsForMonth` migrado de
// `src/lib/queries.ts` sem mudança de comportamento.

import { prisma } from "@/lib/prisma";

export async function listFinancialRecordsForMonth(
    profileId: string,
    year: number,
    month: number,
) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return prisma.financialRecord.findMany({
        where: { profileId, occurredAt: { gte: start, lte: end } },
        orderBy: { occurredAt: "desc" },
    });
}

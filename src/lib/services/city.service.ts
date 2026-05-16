/**
 * src/lib/services/city.service.ts
 *
 * Service layer para entidade `City` (cidades onde o Privello opera).
 *
 * Cobertura:
 * - Lookup por slug com fallback (`getCityBySlug`).
 * - Get-or-create por slug usado em telas de descobrir (`getOrCreateCityBySlug`).
 * - Listagens públicas e top-N por contagem de perfis.
 *
 * Convenções:
 * - Toda função aqui é server-side (lê Prisma direto). Server Components e Server Actions consomem.
 * - Slugs são lowercase ASCII com hífen (cf. `prisma/seed.ts`). Sufixo de estado opcional (`-rj`, `-sp`).
 * - Pré-auditoria: parte dessa lógica vivia em `src/lib/queries.ts`. Migrada na fase-3-backend.
 */

import { prisma } from "@/lib/prisma";

/**
 * Busca cidade por slug com fallback para slug sem sufixo de estado.
 *
 * Tenta primeiro o slug exato; se não encontra e o slug tem múltiplos segmentos,
 * remove o último segmento (assumido ser o sufixo de UF) e tenta de novo.
 *
 * @example
 *   getCityBySlug("rio-de-janeiro-rj")  // tenta "rio-de-janeiro-rj"; se 404, tenta "rio-de-janeiro"
 *   getCityBySlug("rio-de-janeiro")     // tenta apenas "rio-de-janeiro"
 *
 * @returns A cidade com `districts` carregados (ordem alfabética), ou `null` se nenhuma variante encontrar.
 */
export async function getCityBySlug(slug: string) {
    const exact = await prisma.city.findUnique({
        where: { slug },
        include: { districts: { orderBy: { name: "asc" } } },
    });
    if (exact) return exact;

    // Fallback: strip the last segment (state suffix)
    const parts = slug.split("-");
    if (parts.length > 1) {
        const withoutState = parts.slice(0, -1).join("-");
        return prisma.city.findUnique({
            where: { slug: withoutState },
            include: { districts: { orderBy: { name: "asc" } } },
        });
    }

    return null;
}

/**
 * Deriva nome legível de um slug: "blumenau-sc" → { displayName: "Blumenau", uf: "SC" }
 */
function cityNameFromSlug(slug: string): { displayName: string; uf: string } {
    const parts = slug.split("-");
    const uf = parts[parts.length - 1].toUpperCase();
    const cityParts = parts.slice(0, -1).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
    return { displayName: cityParts.join(" "), uf };
}

/**
 * Busca ou cria cidade por slug.
 */
export async function getOrCreateCityBySlug(slug: string) {
    const existing = await getCityBySlug(slug);
    if (existing) return existing;

    const { displayName, uf } = cityNameFromSlug(slug);
    const name = uf ? `${displayName}, ${uf}` : displayName;

    const city = await prisma.city.upsert({
        where: { slug },
        update: {},
        create: { slug, name },
        include: { districts: { orderBy: { name: "asc" } } },
    });
    return city;
}

/**
 * Lista todas as cidades.
 */
export async function getAllCities() {
    return prisma.city.findMany({ orderBy: { name: "asc" } });
}

/**
 * Lista cidades que possuem reels.
 */
export async function getCitiesWithReels() {
    const rows = await prisma.profile.findMany({
        where: { media: { some: { mediaType: "REEL", isPublic: true } } },
        select: { city: { select: { id: true, name: true, slug: true } } },
        distinct: ["cityId"],
    });
    return rows
        .map((r) => r.city)
        .filter((c): c is NonNullable<typeof c> => !!c)
        .sort((a, b) => a.name.localeCompare(b.name));
}

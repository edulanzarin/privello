/**
 * SEO helpers — Privello (Fase 1/3).
 *
 * Caminho: src/lib/seo.ts
 *
 * Funções utilitárias para metadata + structured data (JSON-LD schema.org)
 * compartilhadas entre rotas. Mantém um único ponto de origem para:
 *
 *  - URL base canônica do site (`getSiteUrl`).
 *  - Builders de JSON-LD por tipo (Organization, Person, BreadcrumbList,
 *    ItemList, FAQPage).
 *
 * Convenções:
 *  - O retorno de cada `*JsonLd()` é um plain object pronto para ser passado
 *    a `<script type="application/ld+json">{JSON.stringify(...)}</script>`.
 *  - Strings nunca contêm HTML; descriptions são limpas para texto plano antes
 *    de chegar aqui.
 *  - URLs são absolutas (com base url).
 *
 * Cf. https://schema.org / https://developers.google.com/search/docs/appearance/structured-data
 */
import { SITE_URL } from "@/lib/constants";

/**
 * URL base canônica. Lê env vars na ordem `NEXT_PUBLIC_BASE_URL` →
 * `AUTH_URL` → `SITE_URL` (constante hardcoded de produção).
 *
 * Nunca termina em `/`. Sempre começa em `https://`.
 */
export function getSiteUrl(): string {
    return (
        process.env.NEXT_PUBLIC_BASE_URL ??
        process.env.AUTH_URL ??
        SITE_URL
    ).replace(/\/+$/, "");
}

/**
 * Compose absoluta a partir de path relativo (ex.: "/descobrir/sao-paulo").
 * Idempotente — se path já for absoluto, retorna como veio.
 */
export function absoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const base = getSiteUrl();
    if (!path.startsWith("/")) path = `/${path}`;
    return `${base}${path}`;
}

/* ───────────────────────── Organization ───────────────────────── */

/**
 * JSON-LD `Organization` raiz — emitido na home.
 *
 * Sinaliza ao Google quem é a entidade que opera o site, com nome, logo,
 * URL canônica e contato. Usado em snippets de busca e knowledge panel.
 */
export function organizationJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${getSiteUrl()}#organization`,
        name: "Privello",
        url: getSiteUrl(),
        logo: absoluteUrl("/opengraph-image"),
        sameAs: [],
        contactPoint: [
            {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "contato.privello@gmail.com",
                availableLanguage: ["Portuguese"],
            },
        ],
    };
}

/**
 * JSON-LD `WebSite` com SearchAction — habilita o sitelinks search box no
 * Google quando o domínio for considerado relevante.
 */
export function websiteJsonLd() {
    const base = getSiteUrl();
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${base}#website`,
        url: base,
        name: "Privello",
        inLanguage: "pt-BR",
        publisher: { "@id": `${base}#organization` },
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${base}/descobrir?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

/* ───────────────────────── Person (perfil) ───────────────────────── */

export type PersonJsonLdInput = {
    slug: string;
    displayName: string;
    age?: number | null;
    cityName: string;
    cityRegion?: string | null;
    tagline?: string | null;
    coverUrl?: string | null;
    aggregateRating?: { ratingValue: number; reviewCount: number } | null;
};

/**
 * JSON-LD `Person` para perfil público de acompanhante.
 *
 * Optamos por `Person` (não `LocalBusiness`) porque a identidade promovida é
 * a profissional individual; cidade entra em `homeLocation` como `Place`. Se
 * houver `aggregateRating` válido (rating + count > 0), emite o nó.
 */
export function personJsonLd(input: PersonJsonLdInput) {
    const url = absoluteUrl(`/p/${input.slug}`);
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${url}#person`,
        name: input.displayName,
        url,
        ...(input.coverUrl ? { image: input.coverUrl } : {}),
        ...(input.tagline ? { description: input.tagline } : {}),
        ...(input.age != null ? { knowsAbout: [`${input.age} anos`] } : {}),
        homeLocation: {
            "@type": "Place",
            address: {
                "@type": "PostalAddress",
                addressLocality: input.cityName,
                ...(input.cityRegion ? { addressRegion: input.cityRegion } : {}),
                addressCountry: "BR",
            },
        },
        ...(input.aggregateRating &&
            input.aggregateRating.reviewCount > 0
            ? {
                aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: input.aggregateRating.ratingValue.toFixed(1),
                    reviewCount: input.aggregateRating.reviewCount,
                    bestRating: 5,
                    worstRating: 1,
                },
            }
            : {}),
    };
}

/* ───────────────────────── BreadcrumbList ───────────────────────── */

export type BreadcrumbItem = { name: string; path: string };

/**
 * JSON-LD `BreadcrumbList` — habilita migalhas de pão nos snippets do Google.
 *
 * Use em rotas profundas: `/descobrir/[city]`, `/p/[slug]`, `/reels/[slug]`.
 * `path` deve começar com `/`.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

/* ───────────────────────── ItemList (listings) ───────────────────────── */

export type ItemListEntry = { name: string; path: string };

/**
 * JSON-LD `ItemList` — informa ao Google que aquela página é uma listagem
 * ordenada e quais URLs estão dentro. Útil para `/descobrir/[city]`,
 * `/em-alta`, `/em-destaque`, `/cidades`.
 */
export function itemListJsonLd(entries: ItemListEntry[], name: string) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        numberOfItems: entries.length,
        itemListElement: entries.map((e, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: e.name,
            url: absoluteUrl(e.path),
        })),
    };
}

/* ───────────────────────── Atalho de render ───────────────────────── */

/**
 * Hash determinístico curto a partir do `@id` para usar como `key` ao
 * renderizar múltiplos `<script type="application/ld+json">`.
 */
export function jsonLdKey(node: { "@id"?: string; "@type"?: string }): string {
    return node["@id"] ?? node["@type"] ?? "ld";
}

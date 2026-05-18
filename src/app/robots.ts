/**
 * Robots.ts — Privello (SEO Fase 1).
 *
 * Caminho: src/app/robots.ts
 * Next docs: app/robots
 *
 * Bloqueia rotas privadas (painel, admin, conta, APIs, fluxos de pagamento e
 * recuperação) para qualquer crawler — esses paths não devem aparecer em busca,
 * podem expor dados de sessão ou gerar 401/403 que poluem o índice.
 *
 * Permite o restante (public discovery, perfis, listagens, legal, hub).
 *
 * O sitemap canônico é exposto em `/sitemap.xml` (gerado por `app/sitemap.ts`).
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.AUTH_URL ?? SITE_URL;

const PRIVATE_PATHS = [
    "/api/",
    "/admin/",
    "/painel/",
    "/conta/",
    "/assinar/",
    "/recuperar-senha/",
    "/cadastro/sucesso",
    "/entrar",
    // Solicitar/avaliar dependem de fluxo logado; o conteúdo principal já vive em /p/[slug].
    "/solicitar/",
    "/avaliar/",
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: PRIVATE_PATHS,
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}

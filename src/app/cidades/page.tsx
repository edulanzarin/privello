/**
 * Página RSC — Lista de todas as cidades atendidas.
 *
 * Rota: `/cidades`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 900` (Route Segment Config — janela de 15min).
 *
 * Grid de cidades com links para `/descobrir/[citySlug]`.
 *
 * Cross-refs:
 * - src/lib/services/city.service.ts (getAllCities)
 */
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getAllCities } from "@/lib/services";

// Cache strategy: revalidate=900 (legacy Route Segment Config).
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 5.
// Lista de cidades; mudança esporádica; janela de 15min.
export const revalidate = 900;

export default async function CidadesPage() {
  let cities: { name: string; slug: string }[] = [];
  try {
    cities = await getAllCities();
  } catch {
    cities = [];
  }

  return (
    <>
      <SiteHeader activeHref="/cidades" />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-serif text-4xl">Cidades</h1>
        <p className="mt-4 max-w-xl text-sm text-muted">Escolha uma cidade para ver perfis verificados e filtros por bairro.</p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link href={`/descobrir/${c.slug}`} className="block border border-line bg-white px-4 py-4 text-sm font-medium hover:border-foreground/30">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        {cities.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Configure o Postgres e rode o seed para listar cidades.</p>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

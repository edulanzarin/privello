/**
 * Página RSC — Lista de todas as cidades atendidas.
 *
 * Rota: `/cidades`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 900` (Route Segment Config — janela de 15min).
 *
 * Visual:
 * - Tahoe Sensual v2 — `<ListingHeader>` com eyebrow rose + contador,
 *   container `max-w-7xl` (steering §5.1: listing archetype), grid responsivo
 *   2/3/4 colunas com cards `rounded-2xl bg-white border-line` e ícone `MapPin`.
 * - Hover dos cards: `border-rose/30` + leve `bg-rose-soft` (afford suave).
 * - `<EmptyState>` quando o seed está vazio.
 *
 * Cross-refs:
 * - `src/lib/services/city.service.ts > getAllCities`
 * - `src/components/ui/listing-header.tsx`
 * - `src/components/ui/empty-state.tsx`
 *
 * Cache strategy: revalidate=900 (legacy Route Segment Config).
 * Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 5.
 */
import Link from "next/link";
import { MapPin } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListingHeader } from "@/components/ui/listing-header";
import { getAllCities } from "@/lib/services";

export const revalidate = 900;

export const metadata = {
  title: "Cidades · Privello",
  description: "Escolha uma cidade para ver perfis verificados e filtros por bairro.",
};

export default async function CidadesPage() {
  let cities: { name: string; slug: string }[] = [];
  try {
    cities = await getAllCities();
  } catch {
    cities = [];
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        <ListingHeader
          eyebrow="Diretório nacional"
          eyebrowVariant="rose"
          title="Cidades"
          subtitle={
            cities.length > 0
              ? `${cities.length} cidades com perfis verificados — escolha onde encontrar.`
              : "Escolha uma cidade para ver perfis verificados e filtros por bairro."
          }
        />

        {cities.length === 0 ? (
          <EmptyState
            title="Nenhuma cidade configurada"
            description="Configure o Postgres e rode o seed para listar cidades."
            action={{ label: "Ir para descobrir", href: "/descobrir" }}
          />
        ) : (
          <ul className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/descobrir/${c.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-4 shadow-[var(--shadow-hairline)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:-translate-y-px hover:border-rose/30 hover:bg-rose-soft hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-soft text-rose transition-colors duration-150 group-hover:bg-rose group-hover:text-white">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-base font-semibold tracking-[-0.011em] text-ink">
                    {c.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

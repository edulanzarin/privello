"use client";

/**
 * `<select>` de cidades que submete o formulário de filtros do admin/moderacao
 * automaticamente ao mudar de opção, preservando os outros filtros (status, q, sort).
 *
 * Props:
 * - `cities` ({ id, name, slug }[]): lista de cidades permitidas no filtro.
 * - `statusFilter` (string): valor do filtro de status (preservado em hidden quando ≠ "pending").
 * - `searchQ` (string): query de busca atual (preservada em hidden quando não vazia).
 * - `sortFilter` (string): ordem atual (preservada em hidden quando ≠ "oldest").
 * - `cityFilter` (string): slug atual selecionado (default do `<select>`).
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 *
 * Side effects:
 * - `e.currentTarget.form.submit()` no `onChange` (re-renderiza a página com novo filtro).
 */
export function AdminCityFilter({
  cities,
  statusFilter,
  searchQ,
  sortFilter,
  cityFilter,
}: {
  cities: { id: string; name: string; slug: string }[];
  statusFilter: string;
  searchQ: string;
  sortFilter: string;
  cityFilter: string;
}) {
  return (
    <form method="get" action="/admin/moderacao">
      {statusFilter !== "pending" && <input type="hidden" name="status" value={statusFilter} />}
      {searchQ && <input type="hidden" name="q" value={searchQ} />}
      {sortFilter !== "oldest" && <input type="hidden" name="sort" value={sortFilter} />}
      <select
        name="city"
        defaultValue={cityFilter}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
        className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-black/20 focus:border-rose transition-all"
      >
        <option value="">Todas as cidades</option>
        {cities.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </form>
  );
}

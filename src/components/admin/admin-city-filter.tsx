"use client";

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
        className="border border-line px-2.5 py-1.5 text-xs outline-none focus:border-foreground/40 bg-white"
      >
        <option value="">Todas as cidades</option>
        {cities.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </form>
  );
}

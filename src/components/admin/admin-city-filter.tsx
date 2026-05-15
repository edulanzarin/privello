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
        className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs outline-none hover:border-black/20 focus:border-[#0a84ff] transition-all"
      >
        <option value="">Todas as cidades</option>
        {cities.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </form>
  );
}

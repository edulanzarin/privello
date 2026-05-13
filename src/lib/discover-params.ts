import type { DiscoverFilters, GenderFilter, ProfileSort } from "@/lib/queries";

export function parseDiscoverSearchParams(raw: Record<string, string | string[] | undefined>): {
  filters: DiscoverFilters;
  sort: ProfileSort;
  view: "grid" | "list";
} {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const pmin = get("pmin");
  const pmax = get("pmax");
  const amin = get("amin");
  const amax = get("amax");

  const genderRaw = get("genero");
  const gender: GenderFilter =
    genderRaw === "garotos" || genderRaw === "casais" ? genderRaw : undefined;

  const searchRaw = get("q")?.trim();
  const districtRaw = get("bairro")?.trim();

  const filters: DiscoverFilters = {
    gender,
    priceMin: pmin ? Number(pmin) : undefined,
    priceMax: pmax ? Number(pmax) : undefined,
    ageMin: amin ? Number(amin) : undefined,
    ageMax: amax ? Number(amax) : undefined,
    verifiedOnly: get("verified") === "1",
    onlineOnly: get("online") === "1",
    hasOwnPlace: get("local") === "1",
    homeVisit: get("domicilio") === "1",
    search: searchRaw || undefined,
    districtSlug: districtRaw || undefined,
  };

  const sortRaw = get("ordem");
  const sort: ProfileSort =
    sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "rating" ? sortRaw : "relevance";

  const view = get("view") === "list" ? "list" : "grid";

  return { filters, sort, view };
}

export function buildDiscoverHref(
  citySlug: string,
  next: Record<string, string | null | undefined>,
  current?: URLSearchParams,
) {
  const p = new URLSearchParams(current?.toString() ?? "");
  for (const [k, v] of Object.entries(next)) {
    if (v === null || v === undefined || v === "") p.delete(k);
    else p.set(k, v);
  }
  const q = p.toString();
  return q ? `/descobrir/${citySlug}?${q}` : `/descobrir/${citySlug}`;
}

/** Builds a discover href from a city slug (e.g. "blumenau-sc") and optional filters. */
export function buildDiscoverHrefFromCity(citySlug: string, params?: Record<string, string>) {
  const p = new URLSearchParams(params);
  const q = p.toString();
  return q ? `/descobrir/${citySlug}?${q}` : `/descobrir/${citySlug}`;
}

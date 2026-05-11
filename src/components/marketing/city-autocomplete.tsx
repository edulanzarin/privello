"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type IbgeMunicipio = {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      };
    };
  };
};

type CityResult = {
  label: string; // "Blumenau, SC"
  slug: string; // "blumenau-sc"
  ibgeId: number;
};

function toSlug(name: string, uf: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    uf.toLowerCase()
  );
}

// Module-level cache so the list is fetched once per page load
let ibgeCache: IbgeMunicipio[] | null = null;
let ibgeFetchPromise: Promise<IbgeMunicipio[]> | null = null;

async function getIbgeMunicipios(): Promise<IbgeMunicipio[]> {
  if (ibgeCache) return ibgeCache;
  if (!ibgeFetchPromise) {
    ibgeFetchPromise = fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    )
      .then((r) => r.json() as Promise<IbgeMunicipio[]>)
      .then((data) => {
        ibgeCache = data;
        return data;
      });
  }
  return ibgeFetchPromise;
}

type Props = {
  /** Called when the user selects a city. Receives the city slug (e.g. "blumenau-sc"). */
  onSelect: (slug: string, label: string) => void;
  /** Initial display value */
  initialLabel?: string;
};

export function CityAutocomplete({ onSelect, initialLabel = "" }: Props) {
  const [query, setQuery] = useState(initialLabel);
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pre-warm the cache as soon as the component mounts
  useEffect(() => {
    getIbgeMunicipios().catch(() => {});
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const all = await getIbgeMunicipios();
        const lower = trimmed
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const filtered = all
          .filter((m) =>
            m.nome
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .startsWith(lower),
          )
          .slice(0, 8)
          .map((m) => {
            const uf = m.microrregiao.mesorregiao.UF.sigla;
            return {
              label: `${m.nome}, ${uf}`,
              slug: toSlug(m.nome, uf),
              ibgeId: m.id,
            };
          });
        setResults(filtered);
        setOpen(filtered.length > 0);
      } catch {
        // silently fail — user can still type
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center gap-3 bg-white px-4 py-3 text-left">
      <MapPin className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />
      <span className="w-full">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Cidade</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Ex: Blumenau, São Paulo…"
          autoComplete="off"
          className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted/60"
        />
      </span>

      {open && (
        <ul className="absolute left-0 top-full z-30 mt-px w-full min-w-[240px] border border-line bg-white py-1 shadow-lg">
          {loading && (
            <li className="px-4 py-2 text-xs text-muted">Buscando…</li>
          )}
          {!loading &&
            results.map((r) => (
              <li key={r.ibgeId}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(r.label);
                    setOpen(false);
                    onSelect(r.slug, r.label);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-black/5"
                >
                  <MapPin className="h-3 w-3 shrink-0 text-muted" strokeWidth={1.5} />
                  {r.label}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

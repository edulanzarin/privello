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
  /** Whether this city exists in our local database */
  isLocal?: boolean;
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

// --- Local cities cache (from our database) ---
type LocalCity = { slug: string; label: string };
let localCitiesCache: LocalCity[] | null = null;
let localCitiesFetchPromise: Promise<LocalCity[]> | null = null;

async function getLocalCities(): Promise<LocalCity[]> {
  if (localCitiesCache) return localCitiesCache;
  if (!localCitiesFetchPromise) {
    localCitiesFetchPromise = fetch("/api/cities")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch local cities");
        return r.json() as Promise<{ cities: LocalCity[] }>;
      })
      .then((data) => {
        localCitiesCache = data.cities;
        return data.cities;
      })
      .catch(() => {
        localCitiesFetchPromise = null;
        return [] as LocalCity[];
      });
  }
  return localCitiesFetchPromise;
}

// --- IBGE cache (all Brazilian municipalities) ---
let ibgeCache: IbgeMunicipio[] | null = null;
let ibgeFetchPromise: Promise<IbgeMunicipio[]> | null = null;

async function getIbgeMunicipios(): Promise<IbgeMunicipio[]> {
  if (ibgeCache) return ibgeCache;
  if (!ibgeFetchPromise) {
    ibgeFetchPromise = fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    )
      .then((r) => {
        if (!r.ok) throw new Error("IBGE API error");
        return r.json() as Promise<IbgeMunicipio[]>;
      })
      .then((data) => {
        ibgeCache = data;
        return data;
      })
      .catch(() => {
        // Reset promise so it can be retried
        ibgeFetchPromise = null;
        return [] as IbgeMunicipio[];
      });
  }
  return ibgeFetchPromise;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Props = {
  onSelect: (slug: string, label: string) => void;
  initialLabel?: string;
  /** Compact mode: no label, smaller padding, for use in sticky bars */
  compact?: boolean;
};

/**
 * Autocomplete de cidades brasileiras combinando cidades já presentes no banco
 * (via `/api/cities`) com a base completa de municípios do IBGE
 * (`servicodados.ibge.gov.br`). Cidades locais aparecem primeiro nos resultados.
 *
 * Props:
 * - `onSelect` ((slug: string, label: string) => void): callback ao escolher uma cidade.
 * - `initialLabel?` (string): texto inicial do input (default `""`).
 * - `compact?` (boolean): variação compacta sem ícone/label, para usar em barras sticky.
 *
 * Consumidores conhecidos:
 * - src/components/marketing/hero-search-form.tsx
 * - src/components/discover/city-switcher.tsx
 * - src/app/buscar/buscar-form.tsx
 * - src/app/cadastro/acompanhante/provider-register-form.tsx
 * - src/app/conta/onboarding/perfil/perfil-form.tsx
 * - src/app/painel/perfil/perfil-editor.tsx
 *
 * Side effects:
 * - `fetch("/api/cities")` no mount para popular cache local de cidades cadastradas.
 * - `fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome")`
 *   no mount para popular cache IBGE (chamada externa via HTTPS — acervo público).
 * - Listeners `mousedown` e `touchstart` global para fechar o dropdown ao clicar fora.
 * - Debounce de 150ms na busca conforme o usuário digita.
 */
export function CityAutocomplete({ onSelect, initialLabel = "", compact = false }: Props) {
  const [query, setQuery] = useState(initialLabel);
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Only open the dropdown when the user actually types — not on initial render
  const userTypedRef = useRef(false);

  // Pre-warm both caches as soon as the component mounts
  useEffect(() => {
    getLocalCities().catch(() => { });
    getIbgeMunicipios().catch(() => { });
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!userTypedRef.current || trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const lower = normalize(trimmed);

        // 1. First, search local cities (instant, reliable)
        const localCities = await getLocalCities();
        const localMatches: CityResult[] = localCities
          .filter((c) => normalize(c.label).startsWith(lower) || normalize(c.slug).startsWith(lower))
          .map((c) => ({
            label: c.label,
            slug: c.slug,
            ibgeId: 0,
            isLocal: true,
          }));

        // 2. Then, search IBGE for additional results
        const ibgeAll = await getIbgeMunicipios();
        const localSlugs = new Set(localMatches.map((m) => m.slug));
        const ibgeMatches: CityResult[] = ibgeAll
          .filter((m) => normalize(m.nome).startsWith(lower))
          .slice(0, 8)
          .map((m) => {
            const uf = m.microrregiao.mesorregiao.UF.sigla;
            return {
              label: `${m.nome}, ${uf}`,
              slug: toSlug(m.nome, uf),
              ibgeId: m.id,
            };
          })
          .filter((r) => !localSlugs.has(r.slug)); // avoid duplicates

        // Combine: local cities first, then IBGE results
        const combined = [...localMatches, ...ibgeMatches].slice(0, 8);
        setResults(combined);
        setOpen(combined.length > 0);
      } catch {
        // silently fail — user can still type and submit manually
      } finally {
        setLoading(false);
      }
    }, 150);
  }, [query]);

  // Close dropdown on outside click/touch
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${compact ? "" : "flex items-center gap-3 bg-white px-4 py-3"} text-left`}>
      {!compact && <MapPin className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.5} />}
      <span className={compact ? "block w-full" : "w-full"}>
        {!compact && <span className="block text-xs font-medium text-muted">Cidade</span>}
        <input
          type="text"
          value={query}
          onChange={(e) => { userTypedRef.current = true; setQuery(e.target.value); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={compact ? "Cidade…" : "Ex: São Paulo, SP…"}
          autoComplete="off"
          className={compact
            ? "w-full border-0 bg-transparent p-0 text-md font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:font-normal placeholder:text-ink-dim/60"
            : "mt-0.5 w-full border-0 bg-transparent p-0 text-md font-medium outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:font-normal placeholder:text-muted/60"
          }
        />
      </span>

      {open && (
        <ul className="absolute left-0 top-full z-50 mt-2 w-full min-w-[260px] glass-panel rounded-2xl py-1 overflow-hidden animate-scale-in">
          {loading && (
            <li className="px-4 py-2 text-sm text-ink-dim">Buscando…</li>
          )}
          {!loading &&
            results.map((r) => (
              <li key={r.slug}>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    // Reseta a flag pra impedir o useEffect de re-abrir o
                    // dropdown quando o setQuery abaixo dispara — sem isto,
                    // o label selecionado refaz a busca, encontra 1 resultado
                    // (a própria seleção) e o dropdown volta a abrir.
                    userTypedRef.current = false;
                    setQuery(r.label);
                    setOpen(false);
                    setResults([]);
                    onSelect(r.slug, r.label);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-base text-ink transition-colors hover:bg-line/40"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-rose" strokeWidth={2} />
                  {r.label}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

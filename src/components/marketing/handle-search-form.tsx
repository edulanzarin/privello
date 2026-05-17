"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, AtSign } from "lucide-react";
import { SearchBar, SearchField, SearchSubmit } from "@/components/ui/search-bar";

/**
 * HandleSearchForm — busca global por nome ou @perfil.
 *
 * Caminho: src/components/marketing/handle-search-form.tsx
 * Steering: `.kiro/steering/design-system.md` §13.6.
 *
 * Reusa o primitivo `<SearchBar>` para garantir paridade visual com a
 * `<HeroSearchForm>` (mesma altura, padding, divider, CTA rose).
 *
 * Comportamento:
 *  - Submit empurra o termo (≥ 2 chars) para `/descobrir?q=<term>`.
 *  - Aceita `defaultValue` para pré-preencher quando a página renderiza
 *    com `?q=` na URL.
 *
 * Consumidores:
 *  - src/app/descobrir/page.tsx (seção "Buscar por nome ou @perfil")
 */
export function HandleSearchForm({
    defaultValue = "",
}: {
    defaultValue?: string;
}) {
    const router = useRouter();
    const [value, setValue] = useState(defaultValue);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const term = value.trim();
        if (term.length < 2) return;
        router.push(`/descobrir?q=${encodeURIComponent(term)}`);
    };

    return (
        <SearchBar onSubmit={submit}>
            <SearchField icon={AtSign} divider={false}>
                <input
                    type="search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Nome ou @perfil em qualquer cidade…"
                    className="w-full border-0 bg-transparent p-0 text-md text-ink outline-none placeholder:text-ink-faint focus:ring-0"
                />
            </SearchField>

            <SearchSubmit disabled={value.trim().length < 2}>
                <Search className="h-4 w-4" strokeWidth={2.4} />
                Buscar
            </SearchSubmit>
        </SearchBar>
    );
}

"use client";

import { useState, useTransition } from "react";
import { registerProviderAction } from "@/app/_actions/auth";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";

function nameToSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProviderRegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [cityLabel, setCityLabel] = useState("");

  const slug = nameToSlug(displayName);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!citySlug) { setError("Selecione a cidade onde você atende."); return; }
    const fd = new FormData(e.currentTarget);
    fd.set("citySlug", citySlug);
    fd.set("cityQuery", cityLabel);
    startTransition(async () => {
      const res = await registerProviderAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <div className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Nome artístico <span className="text-coral">*</span>
        </label>
        <p className="mt-0.5 text-[11px] text-muted">Como você aparece no anúncio — pode ter iguais</p>
        <input
          name="displayName"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          placeholder="Ex: Valentina"
        />
        {slug && (
          <p className="mt-1.5 text-xs text-muted">
            Seu @:{" "}
            <span className="font-semibold text-foreground">@{slug}</span>
            <span className="ml-1 text-muted/60">· único, você pode editar depois</span>
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="w-32 shrink-0">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Idade <span className="text-coral">*</span>
          </label>
          <input
            name="age"
            type="number"
            required
            min={18}
            max={99}
            className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
            placeholder="25"
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Cidade onde atende <span className="text-coral">*</span>
          </label>
          <div className="mt-2 border border-line bg-white">
            <CityAutocomplete
              compact
              onSelect={(s, lbl) => { setCitySlug(s); setCityLabel(lbl); }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Dados de acesso</p>
        <p className="mt-1 text-[11px] text-muted">Privados — não aparecem no seu anúncio.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Senha
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-coral py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-60"
      >
        {pending ? "Criando perfil…" : "Criar perfil e continuar"}
      </button>

      <p className="text-center text-xs text-muted">
        Ao criar perfil você confirma ter +18 anos e concorda com os termos.
      </p>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { registerProviderAction } from "@/app/_actions/auth";

export function ProviderRegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
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

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Nome artístico / como quer aparecer
          </label>
          <input
            name="displayName"
            type="text"
            required
            className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
            placeholder="Ex: Valentina"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Idade
          </label>
          <input
            name="age"
            type="number"
            required
            min={18}
            max={99}
            className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
            placeholder="18"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            WhatsApp
          </label>
          <input
            name="phone"
            type="tel"
            className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
            placeholder="+55 11 9..."
          />
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Acesso à conta</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
          Seu nome completo
        </label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          placeholder="Nome real (privado)"
        />
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

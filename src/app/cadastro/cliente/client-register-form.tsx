"use client";

import { useState, useTransition } from "react";
import { registerClientAction } from "@/app/_actions/auth";

export function ClientRegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerClientAction(fd);
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
          Nome
        </label>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
          placeholder="Seu nome"
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
        className="w-full bg-foreground py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-foreground/90 disabled:opacity-60"
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="text-center text-xs text-muted">
        Ao criar conta você confirma ter +18 anos.
      </p>
    </form>
  );
}

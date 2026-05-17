"use client";

import { useState, useTransition } from "react";
import { registerClientAction } from "@/app/_actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * ClientRegisterForm — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/cadastro/cliente/client-register-form.tsx
 * Steering: `.kiro/steering/design-system.md` §6 (forms), §16.3 (copy).
 *
 * Form de cadastro de cliente. Slug normalizado conforme regra
 * `cleanSlug` (lowercase + sem acentos + apenas a-z/0-9/hífen).
 */
export function ClientRegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState("");

  function cleanSlug(s: string) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-/, "");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("slug", slug);
    startTransition(async () => {
      const res = await registerClientAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <Card
          variant="danger-subtle"
          padding="sm"
          className="text-base text-danger"
        >
          {error}
        </Card>
      )}

      <Input
        name="name"
        label="Nome"
        hint="Nome exibido na plataforma — pode alterar quando quiser"
        required
        autoComplete="name"
        placeholder="Ex: João Silva"
      />

      <div>
        <Input
          label="Seu @perfil"
          hint="Único na plataforma — só pode alterar 1× por mês"
          prefix="@"
          value={slug}
          onChange={(e) => setSlug(cleanSlug(e.target.value))}
          placeholder="joao-silva"
        />
        {slug && (
          <p className="mt-1.5 text-sm text-ink-dim">
            Seu perfil:{" "}
            <span className="font-semibold text-ink">privello.com/@{slug}</span>
          </p>
        )}
      </div>

      <Input
        name="email"
        type="email"
        label="E-mail"
        required
        autoComplete="email"
        placeholder="seu@email.com"
      />

      <Input
        name="password"
        type="password"
        label="Senha"
        required
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={pending}
        className="min-h-[44px] w-full"
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-ink-dim">
        Ao criar conta você confirma ter +18 anos.
      </p>
    </form>
  );
}

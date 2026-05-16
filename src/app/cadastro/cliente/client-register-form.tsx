"use client";

import { useState, useTransition } from "react";
import { registerClientAction } from "@/app/_actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ClientRegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
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
        <div className="rounded-xl bg-red-50 border border-red-200/50 px-4 py-3 text-base text-danger">
          {error}
        </div>
      )}

      <Input
        name="name"
        label="Nome"
        hint="Nome exibido na plataforma — pode alterar quando quiser"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: João Silva"
      />

      <div>
        <Input
          label="Seu @"
          hint="Único na plataforma — só pode alterar 1x por mês"
          prefix="@"
          value={slug}
          onChange={(e) => setSlug(cleanSlug(e.target.value))}
          placeholder="joao-silva"
        />
        {slug && (
          <p className="mt-1.5 text-sm text-muted">
            Seu perfil: <span className="font-medium text-foreground">privello.com/@{slug}</span>
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
        variant="coral"
        size="lg"
        loading={pending}
        className="w-full min-h-[44px]"
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted">
        Ao criar conta você confirma ter +18 anos.
      </p>
    </form>
  );
}

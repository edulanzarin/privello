"use client";

import { useTransition } from "react";
import { loginAction } from "@/app/_actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (callbackUrl) fd.set("callbackUrl", callbackUrl);
    startTransition(async () => { await loginAction(fd); });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <Input
        name="email"
        type="email"
        required
        autoComplete="email"
        label="E-mail"
        placeholder="seu@email.com"
      />

      <Input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        label="Senha"
        placeholder="••••••••"
      />

      <Button
        type="submit"
        variant="coral"
        size="lg"
        loading={pending}
        className="w-full mt-2"
      >
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

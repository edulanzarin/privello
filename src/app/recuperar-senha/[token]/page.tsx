"use client";

/**
 * Página Client — Redefinir senha com token enviado por e-mail.
 *
 * Rota: `/recuperar-senha/[token]`.
 * Tipo: Client Component.
 * Auth: público (token é a credencial efêmera; expira em 1h).
 *
 * Cross-refs:
 *  - src/app/_actions/password-reset.ts (resetPassword)
 */
import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/app/_actions/password-reset";
import { AuthShell } from "@/components/layout/auth-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RedefinirSenhaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("token", token);
    startTransition(async () => {
      const res = await resetPassword(fd);
      if (res.error) setError(res.error);
      else router.push("/entrar?reset=1");
    });
  }

  return (
    <AuthShell>
      <Card variant="solid" padding="lg">
        <h1 className="text-2xl font-bold tracking-[-0.022em] text-ink">
          Nova senha
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Escolha uma nova senha para sua conta.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            name="password"
            type="password"
            label="Nova senha"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />

          <Input
            name="confirm"
            type="password"
            label="Confirmar nova senha"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repita a senha"
          />

          {error && (
            <Card
              variant="danger-subtle"
              padding="sm"
              className="text-sm text-danger"
            >
              {error}
            </Card>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            className="w-full"
          >
            {pending ? "Salvando…" : "Redefinir senha"}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}

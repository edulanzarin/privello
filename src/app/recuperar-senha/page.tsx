"use client";

/**
 * Página Client — Solicitar recuperação de senha por e-mail.
 *
 * Rota: `/recuperar-senha`.
 * Tipo: Client Component (`"use client"`).
 * Auth: público.
 * Cache: default (Client Component).
 *
 * Form de e-mail; chama o server action `requestPasswordReset` e mostra
 * confirmação genérica (não vaza se o e-mail existe).
 *
 * Cross-refs:
 *  - src/app/_actions/password-reset.ts (requestPasswordReset)
 *  - src/app/recuperar-senha/[token]/page.tsx
 */
import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/_actions/password-reset";
import { AuthShell } from "@/components/layout/auth-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RecuperarSenhaPage() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await requestPasswordReset(fd);
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <AuthShell
      footer={
        <Link
          href="/entrar"
          className="font-semibold text-rose hover:underline"
        >
          Voltar ao login
        </Link>
      }
    >
      <Card variant="solid" padding="lg">
        {done ? (
          <>
            <h1 className="text-2xl font-bold tracking-[-0.022em] text-ink">
              Verifique seu email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">
              Se existe uma conta com esse email, enviamos um link para
              redefinir a senha. O link expira em{" "}
              <span className="font-semibold text-ink">1 hora</span>.
            </p>
            <p className="mt-4 text-xs text-ink-dim">
              Não recebeu?{" "}
              <button
                type="button"
                onClick={() => setDone(false)}
                className="font-semibold text-rose hover:underline"
              >
                Tentar novamente
              </button>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="text-2xl font-bold tracking-[-0.022em] text-ink">
              Recuperar acesso
            </h1>
            <p className="mt-2 text-sm text-ink-dim">
              Informe seu email e enviaremos um link para redefinir a senha.
            </p>

            <div className="mt-6 space-y-4">
              <Input
                name="email"
                type="email"
                required
                autoComplete="email"
                label="E-mail"
                placeholder="seu@email.com"
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
                className="min-h-[44px] w-full"
              >
                {pending ? "Enviando…" : "Enviar link"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </AuthShell>
  );
}

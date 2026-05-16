"use client";

/**
 * Página RSC — Redefinir senha com token enviado por e-mail.
 *
 * Rota: `/recuperar-senha/[token]`.
 * Tipo: Client Component (`"use client"`).
 * Auth: público (token é a credencial efêmera; expira em 1h).
 * Cache: default (Client Component).
 *
 * Recebe o `token` via params, pede nova senha e confirmação, e chama o
 * server action `resetPassword`. Em sucesso, redireciona para
 * `/entrar?reset=1`.
 *
 * Cross-refs:
 * - src/app/_actions/password-reset.ts (resetPassword)
 */
import Link from "next/link";
import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/app/_actions/password-reset";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl">
          privello<span className="text-coral">.</span>
        </Link>

        <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-2xl">Nova senha</h1>
          <p className="mt-2 text-sm text-muted">
            Escolha uma nova senha para sua conta.
          </p>

          <label className="mt-6 block text-base font-medium text-foreground">
            Nova senha
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-lg border border-black/10 bg-white px-3 py-[7px] text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all"
            placeholder="Mínimo 8 caracteres"
          />

          <label className="mt-4 block text-base font-medium text-foreground">
            Confirmar nova senha
          </label>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-lg border border-black/10 bg-white px-3 py-[7px] text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all"
            placeholder="Repita a senha"
          />

          {error && (
            <p className="mt-3 text-xs text-coral">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-lg bg-coral py-3 text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}

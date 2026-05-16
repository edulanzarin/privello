"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/_actions/password-reset";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl">
          privello<span className="text-coral">.</span>
        </Link>

        {done ? (
          <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 shadow-sm">
            <h1 className="font-serif text-2xl">Verifique seu email</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Se existe uma conta com esse email, enviamos um link para redefinir
              a senha. O link expira em <strong>1 hora</strong>.
            </p>
            <p className="mt-4 text-xs text-muted">
              Não recebeu?{" "}
              <button
                className="text-coral hover:underline"
                onClick={() => setDone(false)}
              >
                Tentar novamente
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 shadow-sm">
            <h1 className="font-serif text-2xl">Recuperar acesso</h1>
            <p className="mt-2 text-sm text-muted">
              Informe seu email e enviaremos um link para redefinir a senha.
            </p>

            <label className="mt-6 block text-base font-medium text-foreground">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-black/10 bg-white px-3 py-[7px] text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all"
              placeholder="seu@email.com"
            />

            {error && (
              <p className="mt-3 text-xs text-coral">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-6 w-full rounded-lg bg-coral py-3 text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar link"}
            </button>

            <p className="mt-4 text-center text-xs text-muted">
              <Link href="/entrar" className="hover:text-foreground">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

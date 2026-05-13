"use client";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9f9f7] px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl">
          privello<span className="text-coral">.</span>
        </Link>

        <form onSubmit={handleSubmit} className="mt-10 border border-line bg-white p-8">
          <h1 className="font-serif text-2xl">Nova senha</h1>
          <p className="mt-2 text-sm text-muted">
            Escolha uma nova senha para sua conta.
          </p>

          <label className="mt-6 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Nova senha
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full border border-line bg-[#fdfcfa] px-3 py-2.5 text-sm outline-none focus:border-foreground"
            placeholder="Mínimo 8 caracteres"
          />

          <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-muted">
            Confirmar nova senha
          </label>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full border border-line bg-[#fdfcfa] px-3 py-2.5 text-sm outline-none focus:border-foreground"
            placeholder="Repita a senha"
          />

          {error && (
            <p className="mt-3 text-xs text-coral">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full bg-foreground py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}

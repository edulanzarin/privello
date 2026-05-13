"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { verifyEmailToken } from "@/app/_actions/email-verification";

export default function VerificarEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    verifyEmailToken(token).then((res) => {
      if (res.success) setState("success");
      else {
        setErrorMsg(res.error ?? "Erro desconhecido.");
        setState("error");
      }
    });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9f9f7] px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-xl">
          privello<span className="text-coral">.</span>
        </Link>

        <div className="mt-10 border border-line bg-white p-8 text-center">
          {state === "loading" && (
            <>
              <h1 className="font-serif text-2xl">Verificando…</h1>
              <p className="mt-3 text-sm text-muted">Aguarde um momento.</p>
            </>
          )}

          {state === "success" && (
            <>
              <h1 className="font-serif text-2xl">Email confirmado!</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Sua conta está verificada. Você já pode aproveitar todos os
                recursos da plataforma.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block w-full bg-foreground py-3 text-xs font-bold uppercase tracking-wider text-white"
              >
                Continuar
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <h1 className="font-serif text-2xl">Link inválido</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">{errorMsg}</p>
              <Link
                href="/"
                className="mt-6 inline-block w-full bg-foreground py-3 text-xs font-bold uppercase tracking-wider text-white"
              >
                Ir para o início
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

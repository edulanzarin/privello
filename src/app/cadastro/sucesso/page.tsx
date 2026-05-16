"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, Clock } from "lucide-react";

function SucessoContent() {
  const params = useSearchParams();
  const slug = params.get("s");

  const [status, setStatus] = useState<"waiting" | "ready" | "timeout">("waiting");
  const [, setAttempts] = useState(0);

  useEffect(() => {
    // Sem slug = pagamento já confirmado externamente; pular polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- early-return baseado em prop
    if (!slug) { setStatus("ready"); return; }

    let cancelled = false;
    const MAX = 20;

    async function check() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/cadastro/verificar?s=${slug}`);
        const data = await res.json() as { exists: boolean };
        if (data.exists) {
          setStatus("ready");
          return;
        }
      } catch { /* ignore */ }

      setAttempts((n) => {
        const next = n + 1;
        if (next >= MAX) { setStatus("timeout"); return next; }
        setTimeout(check, 3000);
        return next;
      });
    }

    const t = setTimeout(check, 3000);
    return () => { cancelled = true; clearTimeout(t); };
  }, [slug]);

  if (status === "waiting") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue/10">
          <Loader2 className="h-8 w-8 animate-spin text-blue" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Confirmando pagamento
        </h1>
        <p className="max-w-xs text-sm text-muted">
          Aguarde enquanto confirmamos seu pagamento e criamos sua conta…
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" />
          <span>Isso costuma levar menos de 30 segundos</span>
        </div>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Pagamento em processamento
        </h1>
        <p className="max-w-xs text-sm text-muted">
          Seu pagamento foi recebido, mas a confirmação está demorando mais que o normal.
          <br />
          Sua conta será criada em breve — você receberá acesso automaticamente.
        </p>
        <p className="mt-2 text-sm text-muted">
          Já tem acesso?{" "}
          <Link href="/entrar" className="font-semibold text-blue hover:underline">
            Fazer login →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle className="h-8 w-8 text-success" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Cadastro concluído!
      </h1>
      <p className="max-w-xs text-sm text-muted">
        Sua conta foi criada. Faça login para adicionar suas fotos e ativar seu perfil.
      </p>
      <div className="mt-4 flex flex-col gap-3 w-full max-w-[200px]">
        <Link
          href="/entrar"
          className="rounded-xl bg-coral px-6 py-3 text-center text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
}

export default function CadastroSucessoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Suspense fallback={null}>
          <SucessoContent />
        </Suspense>
      </div>
    </div>
  );
}

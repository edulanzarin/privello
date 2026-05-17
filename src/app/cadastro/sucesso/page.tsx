"use client";

/**
 * Página Client — Confirmação de cadastro: poll do webhook do MP.
 *
 * Rota: `/cadastro/sucesso`.
 * Tipo: Client Component (`"use client"`).
 * Auth: público.
 * Cache: default (Client Component).
 *
 * Recebe `?s=<slug>` da URL e faz polling em `/api/cadastro/verificar` a
 * cada 3s (até 20 tentativas) para detectar quando o webhook do Mercado
 * Pago concluiu a criação da conta. Sem `s`, mostra confirmação imediata.
 *
 * Cross-refs:
 *  - src/app/api/cadastro/verificar/route.ts
 *  - src/app/api/mp/webhook/route.ts
 */
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Loader2, Clock } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function SucessoContent() {
  const params = useSearchParams();
  const slug = params.get("s");

  const [status, setStatus] = useState<"waiting" | "ready" | "timeout">(
    "waiting",
  );
  const [, setAttempts] = useState(0);

  useEffect(() => {
    // Sem slug = pagamento já confirmado externamente; pular polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- early-return baseado em prop
    if (!slug) {
      setStatus("ready");
      return;
    }

    let cancelled = false;
    const MAX = 20;

    async function check() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/cadastro/verificar?s=${slug}`);
        const data = (await res.json()) as { exists: boolean };
        if (data.exists) {
          setStatus("ready");
          return;
        }
      } catch {
        /* ignore */
      }

      setAttempts((n) => {
        const next = n + 1;
        if (next >= MAX) {
          setStatus("timeout");
          return next;
        }
        setTimeout(check, 3000);
        return next;
      });
    }

    const t = setTimeout(check, 3000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  if (status === "waiting") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-info-soft text-info">
          <Loader2 className="h-8 w-8 animate-spin" strokeWidth={2} />
        </span>
        <h1 className="text-3xl font-bold tracking-[-0.022em] text-ink">
          Confirmando pagamento
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-ink-dim">
          Aguarde enquanto confirmamos seu pagamento e criamos sua conta…
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-dim">
          <Clock className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Isso costuma levar menos de 30 segundos</span>
        </div>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Clock className="h-8 w-8" strokeWidth={2} />
        </span>
        <h1 className="text-3xl font-bold tracking-[-0.022em] text-ink">
          Pagamento em processamento
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-ink-dim">
          Seu pagamento foi recebido, mas a confirmação está demorando mais
          que o normal. Sua conta será criada em breve — você receberá acesso
          automaticamente.
        </p>
        <p className="mt-2 text-sm text-ink-dim">
          Já tem acesso?{" "}
          <Link
            href="/entrar"
            className="font-semibold text-rose hover:underline"
          >
            Fazer login →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle className="h-8 w-8" strokeWidth={2} />
      </span>
      <h1 className="text-3xl font-bold tracking-[-0.022em] text-ink">
        Cadastro concluído!
      </h1>
      <p className="max-w-xs text-sm leading-relaxed text-ink-dim">
        Sua conta foi criada. Faça login para adicionar suas fotos e ativar
        seu perfil.
      </p>
      <div className="mt-4 flex w-full max-w-[200px] flex-col gap-3">
        <Button href="/entrar" variant="primary" size="lg">
          Fazer login
        </Button>
      </div>
    </div>
  );
}

export default function CadastroSucessoPage() {
  return (
    <AuthShell caption={null}>
      <Card variant="solid" padding="lg">
        <Suspense fallback={null}>
          <SucessoContent />
        </Suspense>
      </Card>
    </AuthShell>
  );
}

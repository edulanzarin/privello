/**
 * Página RSC — Login — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/entrar`.
 * Tipo: Server Component (form é Client).
 * Auth: público (já-logado é redirecionado para `/`).
 * Cache: `force-dynamic` (lê `auth()` para redirect e `searchParams.error`).
 *
 * Aceita `?callbackUrl=` para redirect pós-login e `?error=` para mostrar
 * mensagem de credenciais inválidas.
 *
 * Cross-refs:
 *  - src/app/entrar/login-form.tsx
 *  - src/app/api/auth/[...nextauth]/route.ts
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 13.
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function EntrarPage({ searchParams }: Props) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl, error } = await searchParams;

  return (
    <AuthShell
      footer={
        <>
          Esqueceu a senha?{" "}
          <Link
            href="/recuperar-senha"
            className="font-semibold text-rose hover:underline"
          >
            Recuperar acesso
          </Link>
        </>
      }
    >
      <Card variant="solid" padding="lg">
        <h1 className="text-center text-3xl font-bold tracking-[-0.022em] text-ink">
          Entrar
        </h1>
        <p className="mt-2 text-center text-md text-ink-dim">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-rose hover:underline"
          >
            Cadastre-se
          </Link>
        </p>

        {error && (
          <Card
            variant="danger-subtle"
            padding="sm"
            className="mt-5 text-center text-base text-danger"
          >
            E-mail ou senha incorretos.
          </Card>
        )}

        <LoginForm callbackUrl={callbackUrl} />
      </Card>
    </AuthShell>
  );
}

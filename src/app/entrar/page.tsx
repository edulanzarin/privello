import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 13 (entrar lê auth() para redirect).
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl, error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      {/* Logo */}
      <Link href="/" className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        privello<span className="text-coral">.</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_16px_40px_rgba(0,0,0,0.06)]">
        <h1 className="text-3xl font-semibold tracking-tight text-center">Entrar</h1>
        <p className="mt-2 text-md text-muted text-center">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-blue hover:underline">
            Cadastre-se
          </Link>
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 border border-red-200/50 px-4 py-3 text-base text-danger text-center">
            E-mail ou senha incorretos.
          </div>
        )}

        <LoginForm callbackUrl={callbackUrl} />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Esqueceu a senha?{" "}
        <Link href="/recuperar-senha" className="text-blue hover:underline">
          Recuperar acesso
        </Link>
      </p>

      <p className="mt-8 text-xs text-muted/60">Conteúdo adulto · +18</p>
    </div>
  );
}

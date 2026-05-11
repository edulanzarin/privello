import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl, error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      {/* Logo */}
      <Link href="/" className="mb-10 text-2xl font-black tracking-tight text-foreground">
        privello<span className="text-coral">.</span>
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-coral underline-offset-2 hover:underline">
            Cadastre-se
          </Link>
        </p>

        {error && (
          <div className="mt-6 border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
            E-mail ou senha incorretos.
          </div>
        )}

        <LoginForm callbackUrl={callbackUrl} />

        <p className="mt-6 text-center text-xs text-muted">
          Esqueceu a senha?{" "}
          <Link href="/recuperar-senha" className="underline underline-offset-2">
            Recuperar acesso
          </Link>
        </p>
      </div>

      <p className="mt-12 text-xs text-muted">Conteúdo adulto · +18</p>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const session = await auth();
  if (session) redirect("/painel");

  const { callbackUrl, error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel */}
      <aside className="flex w-full flex-col justify-between bg-sidebar px-8 py-12 text-white md:max-w-sm md:min-h-screen">
        <div>
          <Link href="/" className="text-xl font-black tracking-tight">
            privello<span className="text-coral">.</span>
          </Link>
          <h1 className="mt-12 text-3xl font-bold leading-tight">
            Bem-vindo de volta.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Acesse seu painel, gerencie seu perfil e acompanhe suas estatísticas.
          </p>
        </div>
        <p className="mt-10 text-xs text-white/30 md:mt-0">
          Conteúdo adulto · +18 · Privello © 2025
        </p>
      </aside>

      {/* Right panel */}
      <main className="flex flex-1 flex-col justify-center bg-background px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
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

          <p className="mt-8 text-center text-xs text-muted">
            Esqueceu a senha?{" "}
            <Link href="/recuperar-senha" className="underline underline-offset-2">
              Recuperar acesso
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

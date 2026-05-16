/**
 * Página RSC — Cadastro: escolher tipo de conta (cliente vs acompanhante).
 *
 * Rota: `/cadastro`.
 * Tipo: Server Component.
 * Auth: público (já-logado é redirecionado para `/painel`).
 * Cache: `force-dynamic` (lê `auth()` para redirect).
 *
 * Splash de cadastro com 2 cards de escolha; encaminha para
 * `/cadastro/cliente` ou `/cadastro/acompanhante`.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserRound, Users } from "lucide-react";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 14 (cadastro lê auth() para redirect).
export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  const session = await auth();
  if (session) redirect("/painel");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel */}
      <aside className="flex w-full flex-col justify-between bg-sidebar px-8 py-12 text-white md:max-w-sm md:min-h-screen">
        <div>
          <Link href="/" className="text-xl font-black tracking-tight">
            privello<span className="text-coral">.</span>
          </Link>
          <h1 className="mt-12 text-3xl font-bold leading-tight">
            Crie sua conta.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Escolha o tipo de conta que melhor descreve você.
          </p>
        </div>
        <p className="mt-10 text-xs text-white/30 md:mt-0">
          Conteúdo adulto · +18 · Privello © 2025
        </p>
      </aside>

      {/* Right panel */}
      <main className="flex flex-1 flex-col justify-center bg-background px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">Quem é você?</h2>
          <p className="mt-2 text-sm text-muted">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-semibold text-coral underline-offset-2 hover:underline">
              Entrar
            </Link>
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {/* Cliente */}
            <Link
              href="/cadastro/cliente"
              className="group flex flex-col gap-4 rounded-2xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-lg hover:-translate-y-0.5 hover:bg-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-line transition group-hover:bg-foreground">
                <UserRound className="h-6 w-6 text-muted transition group-hover:text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold">Sou cliente</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Quero encontrar e entrar em contato com acompanhantes.
                </p>
              </div>
              <span className="mt-auto text-xs font-semibold text-coral">
                Cadastro gratuito →
              </span>
            </Link>

            {/* Acompanhante */}
            <Link
              href="/cadastro/acompanhante"
              className="group flex flex-col gap-4 rounded-2xl border-2 border-coral bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-lg hover:-translate-y-0.5 hover:bg-coral"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral transition group-hover:bg-white">
                <Users className="h-6 w-6 text-white transition group-hover:text-coral" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold transition group-hover:text-white">Sou acompanhante</p>
                <p className="mt-1 text-xs leading-relaxed text-muted transition group-hover:text-white/70">
                  Quero criar meu perfil e anunciar meus serviços.
                </p>
              </div>
              <span className="mt-auto text-xs font-semibold text-coral transition group-hover:text-white">
                Criar perfil →
              </span>
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            Ao se cadastrar você concorda com os{" "}
            <Link href="/termos" className="underline underline-offset-2">termos de uso</Link>
            {" "}e confirma ter +18 anos.
          </p>
        </div>
      </main>
    </div>
  );
}

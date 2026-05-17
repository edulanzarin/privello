/**
 * Página RSC — Cadastro de cliente (CLIENT) — Design System v2.
 *
 * Rota: `/cadastro/cliente`.
 * Tipo: Server Component (form é Client Component).
 * Auth: público (já-logado é redirecionado para `/`).
 * Cache: `force-dynamic` (lê `auth()` para redirect).
 *
 * Layout split: aside escura (branding ink) à esquerda + form à direita.
 *
 * Cross-refs:
 *  - src/app/cadastro/cliente/client-register-form.tsx
 *  - src/app/_actions/auth.ts
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { ClientRegisterForm } from "./client-register-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 15.
export const dynamic = "force-dynamic";

const BENEFITS = [
  "Cadastro gratuito",
  "Acesso a todos os perfis",
  "Contato direto via WhatsApp",
  "Privacidade garantida",
];

export default async function CadastroClientePage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Aside escura — branding panel */}
      <aside className="flex w-full flex-col justify-between bg-ink px-8 py-12 text-white lg:min-h-screen lg:max-w-[360px]">
        <div>
          <Link
            href="/"
            className="text-xl font-bold tracking-[-0.025em] text-white"
          >
            privello<span className="text-rose">.</span>
          </Link>
          <h1 className="mt-12 text-4xl font-bold leading-[1.1] tracking-[-0.025em]">
            Conta de cliente.
          </h1>
          <p className="mt-4 max-w-xs text-md leading-relaxed text-white/60">
            Acesse perfis verificados, salve favoritos e entre em contato com
            discrição.
          </p>
          <ul className="mt-8 space-y-3 text-md text-white/70">
            {BENEFITS.map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-xs text-white/30 lg:mt-0">
          Conteúdo adulto · +18 · Privello © 2025
        </p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 flex-col justify-center px-6 py-12 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-dim transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Voltar
          </Link>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Criar conta
          </h2>
          <p className="mt-2 text-md text-ink-dim">
            Já tem conta?{" "}
            <Link
              href="/entrar"
              className="font-semibold text-rose hover:underline"
            >
              Entrar
            </Link>
          </p>
          <ClientRegisterForm />
        </div>
      </main>
    </div>
  );
}

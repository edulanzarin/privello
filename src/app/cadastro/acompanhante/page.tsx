/**
 * Página RSC — Cadastro de acompanhante (PROVIDER) — Design System v2.
 *
 * Rota: `/cadastro/acompanhante`.
 * Tipo: Server Component (form é Client Component).
 * Auth: público (já-logado é redirecionado para `/painel`).
 * Cache: `force-dynamic` (lê `auth()` para redirect).
 *
 * Layout split: aside ink (branding) à esquerda + form multi-step à
 * direita. Mesmo shell visual de `/cadastro/cliente`.
 *
 * Cross-refs:
 *  - src/app/cadastro/acompanhante/provider-register-form.tsx
 *  - src/app/api/cadastro/iniciar/route.ts
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { ProviderRegisterForm } from "./provider-register-form";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 16.
export const dynamic = "force-dynamic";

const BENEFITS = [
  "Perfil verificado com selo",
  "Apareça em buscas por cidade",
  "Painel completo de gestão",
  "Sem comissão sobre encontros",
  "Aprovação em até 24h",
];

export default async function CadastroAcompanhantePage() {
  const session = await auth();
  if (session) redirect("/painel");

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
            Anuncie seu perfil.
          </h1>
          <p className="mt-4 max-w-xs text-md leading-relaxed text-white/60">
            Crie seu perfil verificado e apareça para milhares de clientes em
            todo o Brasil.
          </p>
          <ul className="mt-8 space-y-3 text-md text-white/70">
            {BENEFITS.map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-base leading-relaxed text-white/60">
            Planos a partir de{" "}
            <span className="font-semibold tabular-nums text-white">
              R$ 39,90/mês
            </span>
            . Cancele quando quiser.
          </div>
        </div>
        <p className="mt-10 text-xs text-white/30 lg:mt-0">
          Conteúdo adulto · +18 · Privello © 2025
        </p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 flex-col overflow-y-auto px-6 py-12 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-xl">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-dim transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Voltar
          </Link>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Criar perfil
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
          <ProviderRegisterForm />
        </div>
      </main>
    </div>
  );
}

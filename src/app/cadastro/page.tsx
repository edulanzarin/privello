/**
 * Página RSC — Cadastro: escolher tipo de conta — Design System v2.
 *
 * Rota: `/cadastro`.
 * Tipo: Server Component.
 * Auth: público (já-logado é redirecionado para `/painel`).
 * Cache: `force-dynamic` (lê `auth()` para redirect).
 *
 * Splash de cadastro centralizado, com 2 cards de escolha encaminhando
 * para `/cadastro/cliente` ou `/cadastro/acompanhante`. Reutiliza o
 * `<AuthShell>` por consistência visual com `/entrar` e
 * `/recuperar-senha`.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound, Users, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Card } from "@/components/ui/card";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 14.
export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  const session = await auth();
  if (session) redirect("/painel");

  return (
    <AuthShell
      caption={
        <>
          Ao se cadastrar você concorda com os{" "}
          <Link
            href="/termos-de-uso"
            className="underline-offset-2 hover:underline"
          >
            termos de uso
          </Link>{" "}
          e confirma ter +18 anos.
        </>
      }
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href="/entrar"
            className="font-semibold text-rose hover:underline"
          >
            Entrar
          </Link>
        </>
      }
      width="2xl"
    >
      <div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-[-0.022em] text-ink sm:text-4xl">
            Quem é você?
          </h1>
          <p className="mt-3 text-md text-ink-dim">
            Escolha o tipo de conta que melhor descreve você.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Cliente */}
          <Link
            href="/cadastro/cliente"
            className="group focus-visible:outline-none"
          >
            <Card
              variant="solid"
              padding="lg"
              className="flex h-full flex-col gap-4 transition-all duration-200 ease-[var(--ease-tahoe)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)] group-focus-visible:ring-2 group-focus-visible:ring-rose/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-line/40 text-ink-dim transition-colors group-hover:bg-rose-soft group-hover:text-rose">
                <UserRound className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-lg font-bold tracking-[-0.015em] text-ink">
                  Sou cliente
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  Quero encontrar e entrar em contato com acompanhantes.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider text-rose">
                Cadastro gratuito
                <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </Card>
          </Link>

          {/* Acompanhante */}
          <Link
            href="/cadastro/acompanhante"
            className="group focus-visible:outline-none"
          >
            <Card
              variant="solid"
              padding="lg"
              className="flex h-full flex-col gap-4 border-rose ring-1 ring-rose/30 transition-all duration-200 ease-[var(--ease-tahoe)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-md)] group-focus-visible:ring-2 group-focus-visible:ring-rose/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose text-white transition-colors">
                <Users className="h-6 w-6" strokeWidth={2} />
              </span>
              <div>
                <p className="text-lg font-bold tracking-[-0.015em] text-ink">
                  Sou acompanhante
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  Quero criar meu perfil e anunciar meus serviços.
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider text-rose">
                Criar perfil
                <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </Card>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

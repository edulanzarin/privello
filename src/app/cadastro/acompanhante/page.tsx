import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProviderRegisterForm } from "./provider-register-form";

export const dynamic = "force-dynamic";

export default async function CadastroAcompanhantePage() {
  const session = await auth();
  if (session) redirect("/painel");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex w-full flex-col justify-between bg-[#1d1d1f] px-8 py-12 text-white lg:max-w-[360px] lg:min-h-screen">
        <div>
          <Link href="/" className="text-[17px] font-bold tracking-tight">
            privello<span className="text-coral">.</span>
          </Link>
          <h1 className="mt-12 text-[28px] font-semibold leading-tight tracking-tight">
            Anuncie seu perfil.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-white/60">
            Crie seu perfil verificado e apareça para milhares de clientes em todo o Brasil.
          </p>
          <ul className="mt-8 space-y-3 text-[14px] text-white/70">
            {[
              "Perfil verificado com selo",
              "Apareça em buscas por cidade",
              "Painel completo de gestão",
              "Sem comissão sobre encontros",
              "Aprovação em até 24h",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="h-[6px] w-[6px] rounded-full bg-coral" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] leading-relaxed text-white/60">
            Planos a partir de <span className="font-semibold text-white">R$ 39,90/mês</span>. Cancele quando quiser.
          </div>
        </div>
        <p className="mt-10 text-[11px] text-white/30 lg:mt-0">
          Conteúdo adulto · +18 · Privello © 2025
        </p>
      </aside>

      <main className="flex flex-1 flex-col bg-[#f5f5f7] px-6 py-12 md:px-12 lg:px-16 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl">
          <Link href="/cadastro" className="text-[13px] text-muted hover:text-foreground transition-colors">
            ← Voltar
          </Link>
          <h2 className="mt-4 text-[24px] font-semibold tracking-tight">Criar perfil</h2>
          <p className="mt-2 text-[14px] text-muted">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-medium text-[#0a84ff] hover:underline">
              Entrar
            </Link>
          </p>
          <ProviderRegisterForm />
        </div>
      </main>
    </div>
  );
}

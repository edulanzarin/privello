import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClientRegisterForm } from "./client-register-form";

export const dynamic = "force-dynamic";

export default async function CadastroClientePage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col justify-between bg-sidebar px-8 py-12 text-white md:max-w-sm md:min-h-screen">
        <div>
          <Link href="/" className="text-xl font-black tracking-tight">
            privello<span className="text-coral">.</span>
          </Link>
          <h1 className="mt-12 text-3xl font-bold leading-tight">
            Conta de cliente.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Acesse perfis verificados, salve favoritos e entre em contato com discrição.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {["Cadastro gratuito", "Acesso a todos os perfis", "Contato direto via WhatsApp", "Privacidade garantida"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-coral" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-xs text-white/30 md:mt-0">
          Conteúdo adulto · +18 · Privello © 2025
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center bg-background px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/cadastro" className="text-xs text-muted hover:text-foreground">
            ← Voltar
          </Link>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Criar conta</h2>
          <p className="mt-2 text-sm text-muted">
            Já tem conta?{" "}
            <Link href="/entrar" className="font-semibold text-coral underline-offset-2 hover:underline">
              Entrar
            </Link>
          </p>
          <ClientRegisterForm />
        </div>
      </main>
    </div>
  );
}

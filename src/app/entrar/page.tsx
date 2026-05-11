import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default function EntrarPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <h1 className="font-serif text-3xl">Entrar</h1>
        <p className="mt-4 text-sm text-muted">
          Autenticação (e-mail, OAuth ou magic link) será integrada na próxima etapa. Por enquanto, use o painel de
          demonstração.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/painel" className="bg-foreground py-3 text-center text-sm font-semibold text-white">
            Abrir painel (demo)
          </Link>
          <Link href="/" className="border border-line py-3 text-center text-sm">
            Voltar à home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

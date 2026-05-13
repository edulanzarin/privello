import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="font-serif text-7xl font-extrabold text-line">404</p>
        <h1 className="mt-4 text-xl font-bold">Página não encontrada</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Este link não existe ou o perfil foi removido.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/buscar"
            className="bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-foreground/80 transition"
          >
            Buscar acompanhantes
          </Link>
          <Link
            href="/"
            className="border border-line px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-line transition"
          >
            Início
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

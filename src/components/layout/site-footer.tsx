import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white py-10 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-serif text-lg text-foreground">
          privello<span className="text-coral">.</span>
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/planos" className="hover:text-foreground">
            Planos
          </Link>
          <Link href="/descobrir/sao-paulo" className="hover:text-foreground">
            Descobrir
          </Link>
          <span className="text-line">Conteúdo adulto · +18</span>
        </div>
      </div>
    </footer>
  );
}

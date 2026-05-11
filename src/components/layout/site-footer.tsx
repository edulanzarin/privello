import Link from "next/link";

export function SiteFooter() {
  return (
    /* pb-20 = space for the fixed bottom nav on mobile */
    <footer className="border-t border-line bg-white pb-20 pt-10 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-lg font-black tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/planos" className="hover:text-foreground">Planos</Link>
          <Link href="/descobrir/sao-paulo-sp" className="hover:text-foreground">Descobrir</Link>
          <Link href="/em-alta" className="hover:text-foreground">Em alta</Link>
          <span className="text-line">Conteúdo adulto · +18</span>
        </div>
      </div>
    </footer>
  );
}

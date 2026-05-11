import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/descobrir/sao-paulo", label: "Descobrir" },
  { href: "/cidades", label: "Cidades" },
  { href: "/descobrir/sao-paulo?verified=1", label: "Verificadas" },
  { href: "/novidades", label: "Novidades" },
];

type SiteHeaderProps = {
  variant?: "marketing" | "minimal";
  activeHref?: string;
};

export function SiteHeader({ variant = "marketing", activeHref }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line/80 bg-[#fdfcfa]/95 backdrop-blur-md",
        variant === "minimal" && "border-transparent bg-white",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="text-xl font-black tracking-tight text-foreground">
          privello<span className="text-coral">.</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "border-b-2 border-transparent pb-0.5 transition hover:text-foreground",
                activeHref === item.href && "border-foreground text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            className="rounded-full p-2 text-foreground hover:bg-black/5"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/entrar" className="hidden text-sm font-medium text-foreground sm:inline">
            Entrar
          </Link>
          <Link
            href="/planos"
            className="rounded-none bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white sm:px-5"
          >
            Anunciar perfil
          </Link>
        </div>
      </div>
    </header>
  );
}

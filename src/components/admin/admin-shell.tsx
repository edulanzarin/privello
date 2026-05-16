"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOut, ShieldCheck, MessageCircle, Users, BarChart3, ImageIcon } from "lucide-react";
import { logoutAction } from "@/app/_actions/logout";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/moderacao", label: "Moderação",  icon: ShieldCheck },
  { href: "/admin/suporte",   label: "Suporte",     icon: MessageCircle },
  { href: "/admin/perfis",    label: "Perfis",      icon: Users },
  { href: "/admin/midias",    label: "Mídias",      icon: ImageIcon },
  { href: "/admin/financeiro",label: "Financeiro",  icon: BarChart3 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, start] = useTransition();

  function handleLogout() {
    start(async () => {
      await logoutAction();
      window.location.href = "/entrar";
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950 text-white">
        <div className="mx-auto flex h-12 max-w-screen-xl items-center gap-6 px-4 sm:px-6">
          <Link href="/admin/moderacao" className="mr-2 font-black tracking-tight">
            privello<span className="text-coral">.</span>
          </Link>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold transition",
                  pathname.startsWith(href)
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-xs text-white/40">
            <Link
              href="/"
              target="_blank"
              className="hidden hover:text-white/70 transition sm:block"
            >
              Ver site ↗
            </Link>
            <button
              onClick={handleLogout}
              disabled={pending}
              className="flex items-center gap-1.5 text-white/50 hover:text-white transition disabled:opacity-40"
              title="Sair"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

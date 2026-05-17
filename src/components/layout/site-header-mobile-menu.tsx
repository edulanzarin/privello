"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SiteHeaderMobileMenuProps = {
    isLoggedIn: boolean;
    handle: string | null;
    avatarUrl: string | null;
    userName: string | null;
    profileHref: string;
    navLinks: { href: string; label: string }[];
};

/**
 * Drawer mobile do `SiteHeader` — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/layout/site-header-mobile-menu.tsx
 * Steering: `.kiro/steering/design-system.md` §13.2.
 *
 * Botão hambúrguer abre overlay com glass-panel slide-in da direita.
 * Conteúdo: links de nav + ações (Entrar / Criar conta) ou perfil resumido.
 *
 * Acessibilidade:
 *  - `aria-expanded` no botão trigger.
 *  - Drawer com `role="dialog" aria-modal="true"`.
 *  - Fecha com Escape e clique no backdrop.
 *  - Focus ring canônico ring-rose/40.
 *  - Touch target ≥ 44×44 nos links.
 */
export function SiteHeaderMobileMenu({
    isLoggedIn,
    handle,
    avatarUrl,
    userName,
    profileHref,
    navLinks,
}: SiteHeaderMobileMenuProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Abrir menu"
                aria-expanded={open}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-dim hover:bg-line/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
                <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex justify-end md:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu de navegação"
                >
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-md"
                    />

                    {/* Drawer */}
                    <aside
                        className={cn(
                            "relative flex w-72 max-w-[85vw] flex-col gap-1",
                            "glass-panel rounded-l-3xl rounded-r-none",
                            "border-r-0 px-4 py-6",
                            "animate-fade-in",
                        )}
                    >
                        <div className="flex items-center justify-between pb-2">
                            <span className="text-lg font-semibold tracking-tight text-ink">
                                privello<span className="text-rose">.</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Fechar menu"
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-dim hover:bg-line/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                <X className="h-5 w-5" strokeWidth={1.8} />
                            </button>
                        </div>

                        {/* User block */}
                        {isLoggedIn ? (
                            <Link
                                href={profileHref}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 rounded-2xl border border-line bg-white/40 p-3 transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                            >
                                <Avatar
                                    src={avatarUrl}
                                    alt={userName || handle || ""}
                                    fallback={userName || handle || undefined}
                                    size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-md font-medium text-ink">
                                        {userName || handle || "Minha conta"}
                                    </p>
                                    {handle && (
                                        <p className="truncate text-sm text-ink-dim">
                                            @{handle}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-2 pb-2">
                                <Link
                                    href="/cadastro"
                                    onClick={() => setOpen(false)}
                                    className="rounded-full bg-rose px-5 py-3 text-center text-md font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-150 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    Criar conta
                                </Link>
                                <Link
                                    href="/entrar"
                                    onClick={() => setOpen(false)}
                                    className="rounded-full border border-line bg-white/55 px-5 py-3 text-center text-md font-medium text-ink backdrop-blur-md transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    Entrar
                                </Link>
                            </div>
                        )}

                        {/* Nav */}
                        <nav className="flex flex-col gap-0.5 pt-2" aria-label="Navegação">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className="flex min-h-[44px] items-center rounded-xl px-3 text-md font-medium text-ink-dim hover:bg-line/40 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}
        </>
    );
}

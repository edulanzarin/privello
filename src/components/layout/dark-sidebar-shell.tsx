"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * DarkSidebarShell — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/layout/dark-sidebar-shell.tsx
 * Steering: `.kiro/steering/design-system.md` §13.5.
 *
 * Shell de layout com sidebar lateral ink (preto ameixa) em desktop +
 * header/drawer em mobile, compartilhado entre `/painel` e `/admin`.
 *
 * Renderiza:
 *  - `<aside>` desktop fixo `w-56 bg-ink text-white` com logo, nav e footer.
 *  - `<header>` mobile `h-14` com logo + botão hamburger.
 *  - Drawer mobile com overlay `bg-ink/40 backdrop-blur-sm`.
 *  - `<main>` com `pt-14 md:pl-56 md:pt-0`.
 *
 * Acessibilidade:
 *  - Item ativo recebe `aria-current="page"`.
 *  - Botões hamburger/fechar têm `aria-label` e ≥ 44×44.
 *  - Focus rings `ring-rose/40` (canônico v2).
 *  - Drawer fecha com clique no backdrop ou tecla Escape.
 *
 * Consumidores:
 *  - src/components/painel/painel-sidebar.tsx
 *  - src/components/admin/admin-shell.tsx
 */

export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: string | number;
};

export type DarkSidebarShellProps = {
    logoHref: string;
    nav: NavItem[];
    pathname: string;
    footer: React.ReactNode;
    children: React.ReactNode;
    contentClassName?: string;
};

function isItemActive(itemHref: string, pathname: string): boolean {
    if (itemHref === pathname) return true;
    if (itemHref === "/") return false;
    return pathname.startsWith(itemHref + "/");
}

function ShellLogo({
    href,
    onNavigate,
}: {
    href: string;
    onNavigate?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className="text-lg font-bold tracking-[-0.025em] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
            privello<span className="text-rose">.</span>
        </Link>
    );
}

function ShellNav({
    nav,
    pathname,
    onNavigate,
}: {
    nav: NavItem[];
    pathname: string;
    onNavigate?: () => void;
}) {
    return (
        <nav className="mt-6 flex flex-1 flex-col gap-0.5">
            {nav.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href, pathname);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            // Touch target ≥ 44×44 (WCAG 2.5.5 / Req 12.3): cada nav link
                            // declara `min-h-[44px] min-w-[44px]` mesmo quando o
                            // container `w-56` já garante a largura — manter ambas
                            // as utilities é o contrato textual auditado pela PBT
                            // de Critical Controls (categoria b — ícones de navegação).
                            "flex min-h-[44px] min-w-[44px] items-center gap-3 rounded-lg px-3 py-2 text-base text-white/70 transition-colors",
                            "hover:bg-white/[0.06] hover:text-white",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                            active && "bg-white/[0.08] font-medium text-white",
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && (
                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-2xs font-semibold text-white">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

export function DarkSidebarShell({
    logoHref,
    nav,
    pathname,
    footer,
    children,
    contentClassName,
}: DarkSidebarShellProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            {/* ── Desktop sidebar (md+) ── */}
            <aside className="hidden border-r border-white/10 bg-ink px-4 py-6 pb-16 text-white md:fixed md:left-0 md:top-0 md:flex md:h-screen md:w-56 md:flex-col md:overflow-y-auto">
                <ShellLogo href={logoHref} />
                <ShellNav nav={nav} pathname={pathname} />
                {footer}
            </aside>

            {/* ── Mobile top bar ── */}
            <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-ink px-4 text-white md:hidden">
                <ShellLogo href={logoHref} />
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    aria-label="Abrir menu"
                    aria-expanded={open}
                >
                    <Menu className="h-5 w-5" strokeWidth={2} />
                </button>
            </header>

            {/* ── Mobile drawer overlay ── */}
            {open && (
                <div
                    className="fixed inset-0 z-50 flex md:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu de navegação"
                >
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
                    />

                    <aside className="relative flex w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-ink px-4 py-6 pb-20 text-white">
                        <div className="flex items-center justify-between">
                            <ShellLogo
                                href={logoHref}
                                onNavigate={() => setOpen(false)}
                            />
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                                aria-label="Fechar menu"
                            >
                                <X className="h-5 w-5" strokeWidth={2} />
                            </button>
                        </div>
                        <ShellNav
                            nav={nav}
                            pathname={pathname}
                            onNavigate={() => setOpen(false)}
                        />
                        {footer}
                    </aside>
                </div>
            )}

            {/* ── Conteúdo da página ── */}
            <div className={cn("pt-14 md:pl-56 md:pt-0", contentClassName)}>
                {children}
            </div>
        </>
    );
}

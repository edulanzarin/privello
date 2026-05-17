"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Item de navegação consumido por `DarkSidebarShell`.
 *
 * Cada item renderiza um `<Link>` com ícone, label e (opcionalmente) badge.
 * Estruturas mais ricas (separadores, itens desabilitados, botão de logout
 * embutido na nav, painel de status do plano) ficam a cargo do consumidor —
 * via slot `footer` ou via composição em torno do shell — para manter este
 * primitivo focado em links de navegação.
 */
export type NavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Badge curta exibida à direita do label (ex.: "Premium", número de pendências). */
    badge?: string | number;
};

export type DarkSidebarShellProps = {
    /** Destino do logo `privello.` no topo da sidebar. */
    logoHref: string;
    /** Lista de itens de navegação renderizados como `<Link>`. */
    nav: NavItem[];
    /** Pathname corrente (passado pelo consumidor a partir de `usePathname()`). */
    pathname: string;
    /** Slot do rodapé da sidebar (avatar + role + botão Sair). */
    footer: React.ReactNode;
    /** Conteúdo da página renderizado dentro do `<main>`. */
    children: React.ReactNode;
    /** Classes extras aplicadas ao container do `<main>` (ex.: padding custom). */
    contentClassName?: string;
};

/**
 * Determina se um item de nav deve ser marcado como ativo para o `pathname`
 * corrente. Match exato no href, ou prefixo seguido de `/` para subrotas.
 * Hrefs raiz (`/`) só batem em match exato — sem isso, qualquer pathname
 * seria considerado ativo.
 */
function isItemActive(itemHref: string, pathname: string): boolean {
    if (itemHref === pathname) return true;
    if (itemHref === "/") return false;
    return pathname.startsWith(itemHref + "/");
}

/**
 * Logo `privello.` reusado em desktop, mobile header e drawer mobile.
 */
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
            className="text-lg font-black tracking-tight focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
            privello<span className="text-coral">.</span>
        </Link>
    );
}

/**
 * Lista de links da nav (compartilhada entre desktop e drawer mobile).
 */
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
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                            active && "bg-white/[0.08] font-medium text-white",
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-2xs font-semibold text-white">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * Shell de layout com sidebar lateral escura (desktop) + header e drawer
 * mobile, compartilhado entre `/painel` e `/admin`.
 *
 * Caminho: src/components/layout/dark-sidebar-shell.tsx
 *
 * Renderiza:
 * - `<aside>` desktop fixo `w-56 bg-sidebar text-white` com logo, nav e footer.
 * - `<header>` mobile `h-14` com logo + botão hamburger.
 * - Drawer mobile com overlay `bg-black/40 backdrop-blur-sm`.
 * - `<main>` com `pt-14 md:pl-56 md:pt-0` para acomodar o chrome.
 *
 * Acessibilidade:
 * - Item ativo (segundo `pathname`) recebe `aria-current="page"`.
 * - Botões hamburger/fechar têm `aria-label` e tamanho ≥ 44×44.
 * - Cada link da nav tem `min-h-[44px]` para atender WCAG 2.5.5.
 * - Drawer fecha com clique no backdrop ou tecla `Escape`.
 * - Focus rings em `focus-visible` usando `ring-blue/40` + offset.
 *
 * Consumidores:
 * - `src/components/painel/painel-sidebar.tsx` (após refactor em 9.2).
 * - `src/components/admin/admin-shell.tsx` (após refactor em 10.1).
 */
export function DarkSidebarShell({
    logoHref,
    nav,
    pathname,
    footer,
    children,
    contentClassName,
}: DarkSidebarShellProps) {
    const [open, setOpen] = useState(false);

    // Fecha o drawer mobile com Escape para suportar usuários de teclado.
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
            <aside className="hidden border-r border-white/10 bg-sidebar px-4 py-6 pb-16 text-white md:fixed md:left-0 md:top-0 md:flex md:h-screen md:w-56 md:flex-col md:overflow-y-auto">
                <ShellLogo href={logoHref} />
                <ShellNav nav={nav} pathname={pathname} />
                {footer}
            </aside>

            {/* ── Mobile top bar ── */}
            <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-sidebar px-4 text-white md:hidden">
                <ShellLogo href={logoHref} />
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                    aria-label="Abrir menu"
                    aria-expanded={open}
                >
                    <Menu className="h-5 w-5" strokeWidth={1.5} />
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
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Fechar menu"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <aside className="relative flex w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain bg-sidebar px-4 py-6 pb-20 text-white">
                        <div className="flex items-center justify-between">
                            <ShellLogo href={logoHref} onNavigate={() => setOpen(false)} />
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                                aria-label="Fechar menu"
                            >
                                <X className="h-5 w-5" strokeWidth={1.5} />
                            </button>
                        </div>
                        <ShellNav nav={nav} pathname={pathname} onNavigate={() => setOpen(false)} />
                        {footer}
                    </aside>
                </div>
            )}

            {/* ── Conteúdo da página ── */}
            <div className={cn("pt-14 md:pl-56 md:pt-0", contentClassName)}>{children}</div>
        </>
    );
}

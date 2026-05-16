"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BarChart3, Diamond, Images, LayoutDashboard,
  Star, User, Clock, CircleDollarSign, BookImage, Pencil, Clapperboard, Menu, X, LogOut, HeadphonesIcon, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { LogoutButton } from "@/components/painel/logout-button";
import { logoutAction } from "@/app/_actions/logout";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

type NavItem =
  | { type: "link"; href: string; label: string; icon: typeof LayoutDashboard; badge?: string }
  | { type: "muted"; label: string; icon: typeof LayoutDashboard; badge?: string }
  | { type: "logout"; label: string; icon: typeof LayoutDashboard }
  | { type: "sep"; label: string };

const PLAN_LABELS: Record<string, string> = {
  PREMIUM: "Premium", DESTAQUE: "Destaque", ESSENCIAL: "Essencial",
};

function buildItems(slug: string, planTier?: string): NavItem[] {
  const canStories = planTier === "DESTAQUE" || planTier === "PREMIUM";
  return [
    { type: "link", href: "/painel", label: "Visão geral", icon: LayoutDashboard },
    { type: "link", href: `/p/${slug}`, label: "Ver perfil", icon: User },

    { type: "sep", label: "Conteúdo" },
    { type: "link", href: "/painel/midias", label: "Mídias", icon: Images },
    { type: "link", href: "/painel/reels", label: "Reels", icon: Clapperboard },
    canStories
      ? { type: "link", href: "/painel/stories", label: "Stories", icon: BookImage }
      : { type: "muted", label: "Stories", icon: BookImage, badge: "Plus" },

    { type: "sep", label: "Perfil" },
    { type: "link", href: "/painel/perfil", label: "Editar perfil", icon: Pencil },
    { type: "link", href: "/conta/verificacao", label: "Verificação", icon: ShieldCheck },
    { type: "link", href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
    { type: "link", href: "/painel/valores", label: "Valores", icon: CircleDollarSign },

    { type: "sep", label: "Negócio" },
    { type: "link", href: "/painel/avaliacoes", label: "Avaliações", icon: Star },
    { type: "link", href: "/painel/financeiro", label: "Financeiro", icon: BarChart3, badge: "Premium" },
    { type: "link", href: "/painel/plano", label: "Plano", icon: Diamond },

    { type: "sep", label: "Conta" },
    { type: "link", href: "/painel/suporte", label: "Suporte", icon: HeadphonesIcon },
    { type: "logout", label: "Sair", icon: LogOut },
  ];
}

function NavContent({
  navItems, pathname, displayName, planTier, hasPlan, handle, avatarUrl, onClose,
}: {
  navItems: NavItem[];
  pathname: string;
  displayName: string;
  planTier?: string;
  hasPlan: boolean;
  handle?: string;
  avatarUrl?: string | null;
  onClose?: () => void;
}) {
  const [logoutPending, startLogout] = useTransition();

  function handleLogout() {
    startLogout(async () => {
      await logoutAction();
    });
  }

  return (
    <>
      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {navItems.map((item, idx) => {
          if (item.type === "sep") {
            return (
              <p key={idx} className="mt-4 mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                {item.label}
              </p>
            );
          }

          if (item.type === "muted") {
            return (
              <div key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/30">
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/30">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          if (item.type === "logout") {
            return (
              <button
                key="logout"
                type="button"
                onClick={handleLogout}
                disabled={logoutPending}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            );
          }

          const isActive =
            item.href === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white",
                isActive && "bg-white/[0.08] text-white font-medium",
              )}>
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  item.label === "Financeiro" ? "bg-coral/20 text-coral" : "bg-white/10 text-white",
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Plan status */}
      <div className="mt-4 rounded-lg border border-white/10 p-3">
        <div className="flex items-center gap-2">
          {hasPlan ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#30d158]" strokeWidth={2} />
          ) : (
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-amber-400" />
          )}
          <p className={cn("text-[12px] font-medium", hasPlan ? "text-[#30d158]" : "text-amber-400")}>
            {hasPlan ? (PLAN_LABELS[planTier ?? ""] ?? planTier) : "Sem plano ativo"}
          </p>
        </div>
        <Link href="/painel/plano" onClick={onClose} className="mt-2 block text-[11px] text-coral/80 hover:text-coral transition">
          {hasPlan ? "Gerenciar plano →" : "Assinar um plano →"}
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <Avatar src={avatarUrl} fallback={displayName} size="sm" className="shrink-0 bg-white/10 text-white/60" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
          {handle && <p className="truncate text-[11px] text-white/40">@{handle}</p>}
        </div>
        <LogoutButton />
      </div>
    </>
  );
}

export function PainelSidebar({
  displayName, profileSlug, planTier, hasPlan, handle, avatarUrl,
}: {
  displayName: string;
  profileSlug: string;
  planTier?: string;
  hasPlan: boolean;
  handle?: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const navItems = buildItems(profileSlug, planTier);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-screen md:w-56 md:flex-col md:overflow-y-auto border-r border-white/10 bg-sidebar px-4 py-6 pb-16 text-white">
        <Link href="/" className="text-lg font-black tracking-tight">
          privello<span className="text-coral">.</span>
        </Link>
        <NavContent
          navItems={navItems}
          pathname={pathname}
          displayName={displayName}
          planTier={planTier}
          hasPlan={hasPlan}
          handle={handle}
          avatarUrl={avatarUrl}
        />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-sidebar px-4 text-white md:hidden">
        <Link href="/" className="text-lg font-black tracking-tight">
          privello<span className="text-coral">.</span>
        </Link>
        <div className="flex items-center gap-1">
          <LogoutButton />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <aside
            className="relative flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-sidebar px-4 py-6 pb-20 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="text-lg font-black tracking-tight" onClick={() => setOpen(false)}>
                privello<span className="text-coral">.</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-white/70 hover:bg-white/10"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <NavContent
              navItems={navItems}
              pathname={pathname}
              displayName={displayName}
              planTier={planTier}
              hasPlan={hasPlan}
              handle={handle}
              avatarUrl={avatarUrl}
              onClose={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}

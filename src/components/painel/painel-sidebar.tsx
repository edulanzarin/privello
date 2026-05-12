"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Diamond, Images, LayoutDashboard,
  Star, User, Clock, CircleDollarSign, BookImage, Pencil, Clapperboard,
} from "lucide-react";
import { LogoutButton } from "@/components/painel/logout-button";
import { cn } from "@/lib/utils";

type NavItem =
  | { type: "link";  href: string; label: string; icon: typeof LayoutDashboard; badge?: string }
  | { type: "muted"; label: string; icon: typeof LayoutDashboard; badge?: string }
  | { type: "sep";   label: string };

const PLAN_LABELS: Record<string, string> = {
  PREMIUM: "Premium", DESTAQUE: "Plus", ESSENCIAL: "Basic",
};

function buildItems(slug: string, planTier?: string): NavItem[] {
  const canStories = planTier === "DESTAQUE" || planTier === "PREMIUM";
  return [
    { type: "link",  href: "/painel",       label: "Visão geral",    icon: LayoutDashboard },
    { type: "link",  href: `/p/${slug}`,    label: "Ver perfil",     icon: User },

    { type: "sep",   label: "Conteúdo" },
    { type: "link",  href: "/painel/midias",  label: "Mídias",       icon: Images },
    { type: "link",  href: "/painel/reels",   label: "Reels",        icon: Clapperboard },
    canStories
      ? { type: "link",  href: "/painel/stories", label: "Stories",  icon: BookImage }
      : { type: "muted", label: "Stories",  icon: BookImage, badge: "Plus" },

    { type: "sep",   label: "Perfil" },
    { type: "link",  href: "/painel/perfil",         label: "Editar perfil",   icon: Pencil },
    { type: "link",  href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
    { type: "link",  href: "/painel/valores",         label: "Valores",         icon: CircleDollarSign },

    { type: "sep",   label: "Negócio" },
    { type: "muted", label: "Avaliações",  icon: Star },
    { type: "link",  href: "/painel/financeiro", label: "Financeiro", icon: BarChart3, badge: "Premium" },
    { type: "link",  href: "/painel/plano",      label: "Plano",      icon: Diamond },
  ];
}

export function PainelSidebar({
  displayName, profileSlug, planTier, handle,
}: {
  displayName: string; profileSlug: string; planTier?: string; handle?: string;
}) {
  const pathname = usePathname();
  const navItems = buildItems(profileSlug, planTier);

  return (
    <aside className="flex w-full flex-col border-r border-white/10 bg-sidebar px-4 py-6 text-white md:fixed md:left-0 md:top-0 md:h-[calc(100vh-4rem)] md:w-56 md:overflow-y-auto">
      <Link href="/" className="text-lg font-black tracking-tight">
        privello<span className="text-coral">.</span>
      </Link>

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

          const isActive =
            item.href === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white",
                isActive && "border-l-2 border-coral bg-white/5 pl-[10px] text-white",
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

      <div className="mt-4 rounded border border-white/10 p-3 text-xs">
        <p className="text-white/40">Plano atual</p>
        <p className="mt-0.5 font-semibold">{PLAN_LABELS[planTier ?? ""] ?? "Basic"}</p>
        {planTier !== "PREMIUM" && (
          <Link href="/painel/plano" className="mt-1.5 block text-xs text-coral hover:underline">
            Fazer upgrade →
          </Link>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
          {handle && <p className="truncate text-[11px] text-white/40">@{handle}</p>}
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

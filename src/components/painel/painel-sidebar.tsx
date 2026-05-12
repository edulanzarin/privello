"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Diamond,
  ImageIcon,
  LayoutDashboard,
  Star,
  User,
  Clock,
  CircleDollarSign,
  CircleDot,
} from "lucide-react";
import { LogoutButton } from "@/components/painel/logout-button";
import { cn } from "@/lib/utils";

type Item =
  | { type: "link"; href: string; label: string; icon: typeof LayoutDashboard; badge?: string }
  | { type: "muted"; label: string; icon: typeof LayoutDashboard; badge?: string };

const items = (slug: string, planTier?: string): Item[] => [
  { type: "link", href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { type: "link", href: `/p/${slug}`, label: "Ver perfil", icon: User },
  { type: "link", href: "/painel/perfil", label: "Editar perfil", icon: ImageIcon },
  { type: "link", href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
  { type: "link", href: "/painel/valores", label: "Valores", icon: CircleDollarSign },
  ...(planTier === "DESTAQUE" || planTier === "PREMIUM"
    ? [{ type: "link" as const, href: "/painel/stories", label: "Stories", icon: CircleDot }]
    : [{ type: "muted" as const, label: "Stories", icon: CircleDot, badge: "Plus" }]),
  { type: "muted", label: "Avaliações", icon: Star },
  { type: "link", href: "/painel/financeiro", label: "Financeiro", icon: BarChart3, badge: "Premium" },
  { type: "link", href: "/painel/plano", label: "Plano", icon: Diamond },
];

const PLAN_LABELS: Record<string, string> = {
  PREMIUM: "Premium",
  DESTAQUE: "Plus",
  ESSENCIAL: "Basic",
};

export function PainelSidebar({ displayName, profileSlug, planTier, handle }: { displayName: string; profileSlug: string; planTier?: string; handle?: string }) {
  const pathname = usePathname();
  const navItems = items(profileSlug, planTier);

  return (
    <aside className="flex w-full flex-col border-r border-white/10 bg-sidebar px-4 py-6 text-white md:fixed md:left-0 md:top-0 md:h-[calc(100vh-4rem)] md:w-56 md:overflow-y-auto">
      <Link href="/" className="text-lg font-black tracking-tight">
        privello<span className="text-coral">.</span>
      </Link>

      <p className="mt-8 text-[10px] font-semibold uppercase tracking-wider text-white/40">Painel</p>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          if (item.type === "muted") {
            return (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/35"
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/40">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          const isActive =
            ["/painel/financeiro", "/painel/disponibilidade", "/painel/valores", "/painel/perfil", "/painel/stories"].includes(item.href)
              ? pathname.startsWith(item.href)
              : item.href === "/painel"
                ? pathname === "/painel"
                : pathname === item.href;

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white",
                isActive && "border-l-2 border-coral bg-white/5 pl-[10px] text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    item.label === "Financeiro" ? "bg-coral/20 text-coral" : "bg-white/10 text-white",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded border border-white/10 p-3 text-xs">
        <p className="text-white/50">Plano atual</p>
        <p className="mt-1 font-semibold">{PLAN_LABELS[planTier ?? ""] ?? "Basic"}</p>
        {planTier !== "PREMIUM" && (
          <Link href="/painel/plano" className="mt-2 block text-coral hover:underline">
            Fazer upgrade →
          </Link>
        )}
      </div>

      {/* User + logout */}
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

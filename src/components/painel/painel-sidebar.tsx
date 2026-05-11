"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Diamond,
  ImageIcon,
  LayoutDashboard,
  MessageCircle,
  Star,
  User,
  Clock,
  CircleDollarSign,
} from "lucide-react";
import { LogoutButton } from "@/components/painel/logout-button";
import { DEMO_PROVIDER_SLUG } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Item =
  | { type: "link"; href: string; label: string; icon: typeof LayoutDashboard; badge?: string }
  | { type: "muted"; label: string; icon: typeof LayoutDashboard };

const items: Item[] = [
  { type: "link", href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { type: "link", href: "/painel/solicitacoes", label: "Solicitações", icon: Calendar, badge: "4" },
  { type: "link", href: `/p/${DEMO_PROVIDER_SLUG}`, label: "Meu perfil", icon: User },
  { type: "link", href: "/conta/onboarding/fotos", label: "Fotos", icon: ImageIcon },
  { type: "link", href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
  { type: "link", href: "/painel/valores", label: "Valores", icon: CircleDollarSign },
  { type: "muted", label: "Cliques no WhatsApp", icon: MessageCircle },
  { type: "muted", label: "Avaliações", icon: Star },
  { type: "link", href: "/painel/financeiro", label: "Financeiro", icon: BarChart3, badge: "Premium" },
  { type: "link", href: "/planos", label: "Plano", icon: Diamond },
];

export function PainelSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-r border-white/10 bg-sidebar px-4 py-6 text-white md:fixed md:left-0 md:top-0 md:h-[calc(100vh-4rem)] md:w-56 md:overflow-y-auto">
      <Link href="/" className="text-lg font-black tracking-tight">
        privello<span className="text-coral">.</span>
      </Link>

      <p className="mt-8 text-[10px] font-semibold uppercase tracking-wider text-white/40">Painel</p>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          if (item.type === "muted") {
            return (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/35"
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </div>
            );
          }

          const isActive =
            item.href === "/painel/financeiro"
              ? pathname.startsWith("/painel/financeiro")
              : item.href === "/painel/solicitacoes"
                ? pathname.startsWith("/painel/solicitacoes")
                : item.href === "/painel/disponibilidade"
                  ? pathname.startsWith("/painel/disponibilidade")
                  : item.href === "/painel/valores"
                    ? pathname.startsWith("/painel/valores")
                    : item.href === "/painel"
                      ? pathname === "/painel"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

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
        <p className="text-white/50">Plano Premium</p>
        <p className="mt-1 font-semibold">23 dias restantes</p>
        <div className="mt-2 h-1 overflow-hidden bg-white/10">
          <div className="h-full w-3/4 bg-coral" />
        </div>
      </div>

      {/* User + logout */}
      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
        <span className="flex-1 truncate text-sm font-medium">{displayName}</span>
        <LogoutButton />
      </div>
    </aside>
  );
}

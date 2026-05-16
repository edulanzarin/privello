"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Play, Users, User, ShieldCheck, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export const LAST_CITY_KEY = "privello:lastCitySlug";

type BottomNavProps = {
  isLoggedIn: boolean;
  userRole?: string;
  isAdmin?: boolean;
  providerSlug?: string | null;
};

/**
 * Bottom navigation fixo no rodapé (mobile-first) com versões diferentes por
 * `userRole`: PROVIDER vê apenas Painel + Meu perfil; demais usuários veem
 * Home / Acompanhantes / Reels / Perfil-ou-Admin. Cada item tem touch target
 * mínimo 44×44 (Critical Control da fase-6).
 *
 * Props:
 * - `isLoggedIn` (boolean): controla destino e label do item de perfil ("Perfil" vs "Entrar").
 * - `userRole?` (string): "CLIENT" | "PROVIDER" | "ADMIN" | "MODERATOR".
 * - `isAdmin?` (boolean): se true, substitui o item de perfil por "Admin → /admin/moderacao".
 * - `providerSlug?` (string | null): slug do provider para link "Meu perfil → /p/[slug]".
 *
 * Consumidores conhecidos:
 * - src/components/layout/bottom-nav-wrapper.tsx (RSC wrapper único)
 *
 * Side effects:
 * - `sessionStorage.getItem(LAST_CITY_KEY)` para restaurar última cidade no clique
 *   em "Acompanhantes"; cai em `/buscar` quando não há cidade salva.
 * - `router.push(...)` para navegação client-side.
 */
export function BottomNav({ isLoggedIn, userRole, isAdmin, providerSlug }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isProvider = userRole === "PROVIDER";

  function handleAcompanhantes(e: React.MouseEvent) {
    e.preventDefault();
    const saved = sessionStorage.getItem(LAST_CITY_KEY);
    if (saved) {
      router.push(`/descobrir/${saved}`);
    } else {
      router.push("/buscar");
    }
  }

  // Provider: only Painel + Ver perfil
  if (isProvider) {
    const profileHref = providerSlug ? `/p/${providerSlug}` : "/painel";
    const providerItems = [
      {
        key: "painel",
        href: "/painel",
        label: "Painel",
        icon: LayoutDashboard,
        active: pathname.startsWith("/painel"),
      },
      {
        key: "meu-perfil",
        href: profileHref,
        label: "Meu perfil",
        icon: User,
        active: pathname === profileHref,
      },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.08] bg-white">
        <div className="mx-auto flex h-[52px] max-w-lg items-center justify-around px-2">
          {providerItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-[2px] px-10 py-1 text-2xs font-medium transition-colors",
                  item.active ? "text-coral" : "text-muted hover:text-foreground",
                )}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={item.active ? 2.2 : 1.5}
                  fill={item.active ? "currentColor" : "none"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Everyone else: full nav
  const profileHref = isLoggedIn ? "/conta/perfil" : "/entrar";

  const items = [
    {
      key: "home",
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
      onClick: undefined as React.MouseEventHandler | undefined,
    },
    {
      key: "acompanhantes",
      href: "/buscar",
      label: "Acompanhantes",
      icon: Users,
      active: pathname.startsWith("/descobrir") || pathname.startsWith("/buscar"),
      onClick: handleAcompanhantes,
    },
    {
      key: "reels",
      href: "/reels",
      label: "Reels",
      icon: Play,
      active: pathname.startsWith("/reels"),
      onClick: undefined as React.MouseEventHandler | undefined,
    },
    isAdmin
      ? {
        key: "admin",
        href: "/admin/moderacao",
        label: "Admin",
        icon: ShieldCheck,
        active: pathname.startsWith("/admin"),
        onClick: undefined as React.MouseEventHandler | undefined,
      }
      : {
        key: "perfil",
        href: profileHref,
        label: isLoggedIn ? "Perfil" : "Entrar",
        icon: User,
        active:
          pathname.startsWith("/conta") ||
          pathname === "/entrar",
        onClick: undefined as React.MouseEventHandler | undefined,
      },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.08] bg-white">
      <div className="mx-auto flex h-[52px] max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-[2px] px-5 py-1 text-2xs font-medium transition-colors",
                item.active ? "text-coral" : "text-muted hover:text-foreground",
              )}
            >
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={item.active ? 2.2 : 1.5}
                fill={item.active ? "currentColor" : "none"}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

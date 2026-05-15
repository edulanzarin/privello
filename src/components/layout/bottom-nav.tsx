"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Play, Users, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const LAST_CITY_KEY = "privello:lastCitySlug";

type BottomNavProps = {
  isLoggedIn: boolean;
  userRole?: string;
  isAdmin?: boolean;
};

export function BottomNav({ isLoggedIn, userRole, isAdmin }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const profileHref = isLoggedIn
    ? userRole === "PROVIDER" ? "/painel" : "/conta/perfil"
    : "/entrar";

  function handleAcompanhantes(e: React.MouseEvent) {
    e.preventDefault();
    const saved = sessionStorage.getItem(LAST_CITY_KEY);
    if (saved) {
      router.push(`/descobrir/${saved}`);
    } else {
      router.push("/buscar");
    }
  }

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
          pathname.startsWith("/painel") ||
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
                "relative flex flex-col items-center gap-[2px] px-5 py-1 text-[10px] font-medium transition-colors",
                item.active ? "text-coral" : "text-[#8e8e93] hover:text-foreground",
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Play, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  isLoggedIn: boolean;
  userRole?: string;
};

export function BottomNav({ isLoggedIn, userRole }: BottomNavProps) {
  const pathname = usePathname();

  const profileHref = isLoggedIn
    ? userRole === "PROVIDER" ? "/painel" : "/conta/perfil"
    : "/entrar";

  const items = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/buscar",
      label: "Buscar",
      icon: Search,
      active: pathname.startsWith("/buscar") || pathname.startsWith("/descobrir"),
    },
    {
      href: "/reels",
      label: "Reels",
      icon: Play,
      active: pathname.startsWith("/reels"),
      soon: true,
    },
    {
      href: profileHref,
      label: isLoggedIn ? "Perfil" : "Entrar",
      icon: User,
      active:
        pathname.startsWith("/painel") ||
        pathname.startsWith("/conta") ||
        pathname === "/entrar",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider transition",
                item.active ? "text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5 transition"
                  strokeWidth={item.active ? 2 : 1.5}
                />
                {item.soon && (
                  <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-coral text-[7px] font-bold text-white">
                    +
                  </span>
                )}
              </div>
              <span>{item.label}</span>
              {item.active && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-coral" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

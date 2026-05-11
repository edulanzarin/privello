"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Home, Play, User } from "lucide-react";
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
      href: "/em-alta",
      label: "Em alta",
      icon: Flame,
      active: pathname.startsWith("/em-alta"),
      highlight: true, // coral accent
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
      active: pathname.startsWith("/painel") || pathname.startsWith("/conta/perfil") || pathname === "/entrar",
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
                "relative flex flex-col items-center gap-1 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition",
                item.active
                  ? item.highlight ? "text-coral" : "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition",
                    item.highlight && item.active && "fill-coral text-coral",
                    item.highlight && !item.active && "text-muted",
                  )}
                  strokeWidth={item.active ? 2 : 1.5}
                />
                {item.soon && (
                  <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-coral text-[7px] font-bold text-white">
                    +
                  </span>
                )}
              </div>
              <span>{item.label}</span>
              {/* Active indicator dot */}
              {item.active && (
                <span className={cn(
                  "absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2",
                  item.highlight ? "bg-coral" : "bg-foreground",
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

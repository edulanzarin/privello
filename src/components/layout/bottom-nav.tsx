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
 * Bottom navigation — Design System v2 (Tahoe Sensual).
 *
 * Steering: `.kiro/steering/design-system.md` §13.1.
 *
 * Pill flutuante com `.glass-pill`, posicionada `fixed bottom-4 left-1/2
 * -translate-x-1/2`. Não cola no rodapé — flutua a 16px do bottom.
 * Mobile-only (visível em `< 768px`); desktop usa header.
 *
 * Item ativo: `bg-rose-soft text-rose` com pill background.
 * Item inativo: `text-ink-dim`.
 * Touch target ≥ 44×44 por item (Req 12.3, WCAG 2.5.5).
 * Safe-area aware: padding-bottom env() para iPhone notch.
 *
 * Versões:
 *  - PROVIDER: Painel + Meu perfil (2 itens, mais ar entre eles).
 *  - Demais: Home / Acompanhantes / Reels / Perfil-ou-Admin (4 itens).
 *
 * Props:
 *  - `isLoggedIn` (boolean): controla destino e label do item de perfil.
 *  - `userRole?` (string): "CLIENT" | "PROVIDER" | "ADMIN" | "MODERATOR".
 *  - `isAdmin?` (boolean): substitui Perfil por Admin se true.
 *  - `providerSlug?` (string | null): slug para "/p/[slug]" do provider.
 *
 * Side effects:
 *  - `sessionStorage.getItem(LAST_CITY_KEY)` ao clicar "Acompanhantes".
 *  - `router.push(...)` para navegação client-side.
 */
export function BottomNav({ isLoggedIn, userRole, isAdmin, providerSlug }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isProvider = userRole === "PROVIDER";

  function handleAcompanhantes(e: React.MouseEvent) {
    e.preventDefault();
    const saved = typeof window !== "undefined"
      ? sessionStorage.getItem(LAST_CITY_KEY)
      : null;
    if (saved) {
      router.push(`/descobrir/${saved}`);
    } else {
      router.push("/buscar");
    }
  }

  // Provider: only Painel + Meu perfil
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
      <NavShell>
        {providerItems.map(({ key, ...item }) => (
          <NavItem key={key} {...item} />
        ))}
      </NavShell>
    );
  }

  // Everyone else
  const profileHref = isLoggedIn ? "/conta/perfil" : "/entrar";

  const items = [
    {
      key: "home",
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
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
    },
    isAdmin
      ? {
        key: "admin",
        href: "/admin/moderacao",
        label: "Admin",
        icon: ShieldCheck,
        active: pathname.startsWith("/admin"),
      }
      : {
        key: "perfil",
        href: profileHref,
        label: isLoggedIn ? "Perfil" : "Entrar",
        icon: User,
        active: pathname.startsWith("/conta") || pathname === "/entrar",
      },
  ];

  return (
    <NavShell>
      {items.map(({ key, ...item }) => (
        <NavItem key={key} {...item} />
      ))}
    </NavShell>
  );
}

/**
 * Shell flutuante glass-pill. Wrapping em <div> externo provê `pb-env()`
 * pra respeitar safe-area do iPhone. A `<nav>` interna é a pill em si.
 */
function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
      }}
    >
      <nav
        className={cn(
          "glass-pill pointer-events-auto",
          "flex items-center gap-1 p-1.5",
          "shadow-[var(--shadow-md)]",
        )}
        aria-label="Navegação principal"
      >
        {children}
      </nav>
    </div>
  );
}

type NavItemProps = {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  onClick?: React.MouseEventHandler;
};

function NavItem({ href, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1.5 text-2xs font-medium transition-all duration-150 ease-[var(--ease-tahoe)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-rose-soft text-rose"
          : "text-ink-dim hover:text-ink active:bg-line/40",
      )}
    >
      <Icon
        className="h-[20px] w-[20px]"
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? "currentColor" : "none"}
      />
      <span className="leading-none">{label}</span>
    </Link>
  );
}

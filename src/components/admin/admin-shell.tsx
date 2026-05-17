"use client";

import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  MessageCircle,
  Users,
  BarChart3,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";

import { LogoutButton } from "@/components/painel/logout-button";
import { Avatar } from "@/components/ui/avatar";
import {
  DarkSidebarShell,
  type NavItem,
} from "@/components/layout/dark-sidebar-shell";

/**
 * Itens de navegação do admin (`NAV_ADMIN` na linguagem da spec).
 *
 * Ordem definida no design (`design.md` §"7. AdminShell"):
 *   Moderação · Suporte · Perfis · Mídias · Financeiro · Verificações.
 *
 * Verificações compartilha rota com `/admin/verificacoes/[id]` — o item raiz
 * do menu serve como entrada genérica; o detalhe é alcançado via fila de
 * moderação. Como `DarkSidebarShell.isItemActive` casa por prefixo, qualquer
 * `/admin/verificacoes/*` mantém o item destacado.
 */
const NAV_ADMIN: NavItem[] = [
  { href: "/admin/moderacao", label: "Moderação", icon: ShieldCheck },
  { href: "/admin/suporte", label: "Suporte", icon: MessageCircle },
  { href: "/admin/perfis", label: "Perfis", icon: Users },
  { href: "/admin/midias", label: "Mídias", icon: ImageIcon },
  { href: "/admin/financeiro", label: "Financeiro", icon: BarChart3 },
  { href: "/admin/verificacoes", label: "Verificações", icon: CheckCircle2 },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MODERATOR: "Moderador",
};

/**
 * Rodapé compartilhado do shell admin: avatar + nome/role + botão Sair.
 *
 * Renderizado em duas posições pelo `DarkSidebarShell` — sidebar desktop e
 * drawer mobile — usando a mesma instância do prop. `LogoutButton` mantém o
 * próprio `useTransition`, então cada cópia gerencia o estado pendente.
 */
function AdminFooter({
  displayName,
  role,
  handle,
  avatarUrl,
}: {
  displayName: string;
  role?: string;
  handle?: string;
  avatarUrl?: string | null;
}) {
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "Admin";

  return (
    <div className="mt-auto">
      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <Avatar
          src={avatarUrl}
          fallback={displayName}
          size="sm"
          className="shrink-0 bg-white/10 text-white/60"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {displayName}
          </p>
          <p className="truncate text-xs text-white/40">
            {handle ? `@${handle}` : roleLabel}
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}

/**
 * Shell de layout das páginas `/admin/*`.
 *
 * Refatorado em 10.1 para consumir `DarkSidebarShell` — o mesmo chrome
 * compartilhado pelo `/painel` (aside fixo desktop, header mobile, drawer
 * com overlay backdrop blur, focus rings, `aria-current`, touch targets
 * ≥ 44×44). Substitui a topbar escura `bg-sidebar` (antes em paleta crua)
 * da versão anterior, eliminando o drift entre admin e painel sem alterar
 * a API consumida pelas pages.
 *
 * Props (todas opcionais para preservar os call-sites existentes
 * `<AdminShell>{children}</AdminShell>`):
 * - `displayName?` (string): nome exibido no rodapé. Default `"Admin"`.
 * - `role?` (string): `"ADMIN" | "MODERATOR"`; mapeado para "Administrador" / "Moderador". Default `"Admin"`.
 * - `handle?` (string): @handle exibido sob o nome quando presente.
 * - `avatarUrl?` (string | null): avatar mostrado no rodapé.
 * - `children` (React.ReactNode): conteúdo da página renderizado dentro do `<main>`.
 *
 * Consumidores conhecidos:
 * - src/app/admin/moderacao/page.tsx
 * - src/app/admin/suporte/page.tsx (e /[id])
 * - src/app/admin/perfis/page.tsx
 * - src/app/admin/midias/page.tsx
 * - src/app/admin/financeiro/page.tsx
 * - src/app/admin/verificacoes/[id]/page.tsx
 *
 * Side effects:
 * - Server action `logoutAction()` no clique em "Sair" via `LogoutButton`.
 * - `usePathname()` para destacar item ativo (delegado ao `DarkSidebarShell`).
 * - Drawer mobile: overlay com `backdrop-blur` + `overscroll-contain`, gerenciado pelo shell.
 */
export function AdminShell({
  children,
  displayName = "Admin",
  role,
  handle,
  avatarUrl,
}: {
  children: React.ReactNode;
  displayName?: string;
  role?: string;
  handle?: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DarkSidebarShell
        logoHref="/admin/moderacao"
        nav={NAV_ADMIN}
        pathname={pathname}
        footer={
          <AdminFooter
            displayName={displayName}
            role={role}
            handle={handle}
            avatarUrl={avatarUrl}
          />
        }
      >
        <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </DarkSidebarShell>
    </div>
  );
}

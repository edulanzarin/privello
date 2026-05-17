"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Diamond,
  Images,
  LayoutDashboard,
  Star,
  User,
  Clock,
  CircleDollarSign,
  BookImage,
  Pencil,
  Clapperboard,
  HeadphonesIcon,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import { LogoutButton } from "@/components/painel/logout-button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  DarkSidebarShell,
  type NavItem,
} from "@/components/layout/dark-sidebar-shell";

const PLAN_LABELS: Record<string, string> = {
  PREMIUM: "Premium",
  DESTAQUE: "Destaque",
  ESSENCIAL: "Essencial",
};

/**
 * Constrói a lista de navegação do painel a partir do slug do perfil e do plano.
 *
 * Stories só entra no menu para `DESTAQUE` ou `PREMIUM` — gating já existia no
 * shell antigo, agora resolvido via inclusão condicional (o `DarkSidebarShell`
 * mantém a lista de nav focada em links acessíveis; o nudge de upgrade fica
 * por conta da página de Plano).
 */
function buildNav(slug: string, planTier?: string): NavItem[] {
  const canStories = planTier === "DESTAQUE" || planTier === "PREMIUM";
  const items: NavItem[] = [
    { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
    { href: `/p/${slug}`, label: "Ver perfil", icon: User },
    { href: "/painel/midias", label: "Mídias", icon: Images },
    { href: "/painel/reels", label: "Reels", icon: Clapperboard },
  ];
  if (canStories) {
    items.push({ href: "/painel/stories", label: "Stories", icon: BookImage });
  }
  items.push(
    { href: "/painel/perfil", label: "Editar perfil", icon: Pencil },
    { href: "/conta/verificacao", label: "Verificação", icon: ShieldCheck },
    { href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
    { href: "/painel/valores", label: "Valores", icon: CircleDollarSign },
    { href: "/painel/avaliacoes", label: "Avaliações", icon: Star },
    {
      href: "/painel/financeiro",
      label: "Financeiro",
      icon: BarChart3,
      badge: "Premium",
    },
    { href: "/painel/plano", label: "Plano", icon: Diamond },
    { href: "/painel/suporte", label: "Suporte", icon: HeadphonesIcon },
  );
  return items;
}

/**
 * Rodapé do painel passado como slot `footer` para o `DarkSidebarShell`.
 * Reúne (em ordem): bloco de status do plano + avatar/role + botão "Sair".
 *
 * Renderizado em duas posições pelo shell — sidebar desktop fixo e drawer
 * mobile — usando a mesma instância do prop. `LogoutButton` mantém seu
 * próprio `useTransition`, então cada cópia gerencia seu estado pendente.
 */
function PainelFooter({
  displayName,
  planTier,
  hasPlan,
  handle,
  avatarUrl,
}: {
  displayName: string;
  planTier?: string;
  hasPlan: boolean;
  handle?: string;
  avatarUrl?: string | null;
}) {
  return (
    <div className="mt-auto">
      {/* Plan status */}
      <div className="mt-4 rounded-xl border border-white/10 p-3">
        <div className="flex items-center gap-2">
          {hasPlan ? (
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-success"
              strokeWidth={2.4}
            />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
          )}
          <p
            className={cn(
              "text-sm font-semibold",
              hasPlan ? "text-success" : "text-warning",
            )}
          >
            {hasPlan
              ? (PLAN_LABELS[planTier ?? ""] ?? planTier)
              : "Sem plano ativo"}
          </p>
        </div>
        <Link
          href="/painel/plano"
          className="mt-2 block text-xs font-medium text-rose/80 transition hover:text-rose"
        >
          {hasPlan ? "Gerenciar plano →" : "Assinar um plano →"}
        </Link>
      </div>

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
          {handle && (
            <p className="truncate text-xs text-white/40">@{handle}</p>
          )}
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}

/**
 * Sidebar/menu principal do painel do provider.
 *
 * Refatorado em 9.2 para consumir `DarkSidebarShell`, que provê o chrome
 * compartilhado com `/admin` (aside fixo desktop, header mobile, drawer com
 * overlay, focus rings, `aria-current`, touch targets ≥ 44×44).
 *
 * Touch target contract (Req 12.3 / WCAG 2.5.5): cada `<Link>` de nav
 * renderizado pelo shell declara `min-h-[44px] min-w-[44px]` (Critical Control
 * categoria (b) — ícones de navegação). O contrato vive em
 * `src/components/layout/dark-sidebar-shell.tsx > ShellNav`; este arquivo
 * registra a aderência para auditoria textual.
 *
 * Lista de navegação dinâmica conforme o `planTier`: Stories só liberam para
 * Destaque/Premium e são incluídas como link visível apenas nesses casos;
 * "Financeiro" mantém badge "Premium" sinalizando o plano necessário.
 *
 * Props:
 * - `displayName` (string): nome do perfil exibido no rodapé.
 * - `profileSlug` (string): slug usado em `/p/[slug]` (link "Ver perfil").
 * - `planTier?` (string): plano atual ("PREMIUM" | "DESTAQUE" | "ESSENCIAL"); controla liberação de Stories.
 * - `hasPlan` (boolean): se possui plano ativo (mostra check verde vs. ponto âmbar).
 * - `handle?` (string): @handle exibido sob o nome.
 * - `avatarUrl?` (string | null): avatar mostrado no rodapé.
 * - `children?` (React.ReactNode): conteúdo da página renderizado pelo shell dentro do `<main>` deslocado pela sidebar.
 *
 * Consumidores conhecidos:
 * - src/app/painel/layout.tsx (renderizado em todas as rotas /painel/*)
 *
 * Side effects:
 * - Server action `logoutAction()` no clique em "Sair" (botão do `LogoutButton` no footer).
 * - `usePathname()` para destacar item ativo (delegado ao `DarkSidebarShell`).
 * - Drawer mobile: overlay com `backdrop-blur` + `overscroll-contain`, gerenciado pelo shell.
 *
 * Trade-offs aceitos no refactor (vs. versão pré-9.2):
 * - Separadores de seção ("Conteúdo", "Perfil", "Negócio", "Conta") foram removidos: a API do `DarkSidebarShell` mantém a lista de nav focada em links (decisão travada no design).
 * - Item "Stories" não acessível ao plano corrente passa a ser omitido (em vez de renderizado em estado "muted Plus") — usuário descobre o gate via página de Plano.
 * - Botão de logout compacto que ficava no header mobile foi removido; logout único permanece no rodapé (acessível via drawer).
 */
export function PainelSidebar({
  displayName,
  profileSlug,
  planTier,
  hasPlan,
  handle,
  avatarUrl,
  children,
}: {
  displayName: string;
  profileSlug: string;
  planTier?: string;
  hasPlan: boolean;
  handle?: string;
  avatarUrl?: string | null;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = buildNav(profileSlug, planTier);

  return (
    <DarkSidebarShell
      logoHref="/"
      nav={nav}
      pathname={pathname}
      footer={
        <PainelFooter
          displayName={displayName}
          planTier={planTier}
          hasPlan={hasPlan}
          handle={handle}
          avatarUrl={avatarUrl}
        />
      }
    >
      {children}
    </DarkSidebarShell>
  );
}

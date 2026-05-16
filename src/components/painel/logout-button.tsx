"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logoutAction } from "@/app/_actions/logout";

/**
 * Botão "Sair" compacto (apenas ícone) usado no header do painel mobile e no rodapé
 * da sidebar desktop. Dispara `logoutAction()` em `useTransition`.
 *
 * Consumidores conhecidos:
 * - src/components/painel/painel-sidebar.tsx (header mobile + rodapé desktop)
 *
 * Side effects:
 * - Server action `logoutAction()` em `src/app/_actions/logout.ts` (encerra sessão NextAuth e redireciona).
 */
export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      title="Sair"
      onClick={handleLogout}
      className="rounded p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}

"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logoutAction } from "@/app/_actions/logout";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Sair"
      onClick={() => startTransition(() => logoutAction())}
      className="rounded p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}

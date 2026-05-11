"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      // Call the signout API route directly
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/";
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      title="Sair"
      className="rounded p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}

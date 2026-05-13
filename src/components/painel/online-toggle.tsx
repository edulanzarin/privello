"use client";

import { useState, useTransition } from "react";
import { toggleOnlineStatus } from "@/app/painel/_actions/provider-settings";

export function OnlineToggle({ initialOnline }: { initialOnline: boolean }) {
  const [online, setOnline] = useState(initialOnline);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      setOnline((v) => !v);
      await toggleOnlineStatus();
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={online ? "Clique para pausar o perfil" : "Clique para ficar online"}
      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
        online
          ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
          : "border-line bg-white text-muted hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success" : "bg-muted"}`} />
      {online ? "Online" : "Pausado"}
    </button>
  );
}

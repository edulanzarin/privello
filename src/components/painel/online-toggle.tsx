"use client";

import { useState, useTransition } from "react";
import { toggleOnlineStatus } from "@/app/painel/_actions/provider-settings";
import { cn } from "@/lib/utils";

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
      title={online ? "Clique para pausar" : "Clique para ficar online"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-[6px] text-[12px] font-medium transition-all active:scale-[0.97] disabled:opacity-50",
        online
          ? "bg-[#30d158]/12 text-[#248a3d]"
          : "bg-black/[0.04] text-muted hover:bg-black/[0.06]",
      )}
    >
      <span className={cn("h-[6px] w-[6px] rounded-full", online ? "bg-[#30d158]" : "bg-muted")} />
      {online ? "Online" : "Pausado"}
    </button>
  );
}

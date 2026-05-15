"use client";

import { useTransition } from "react";

const MP_ENABLED = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

export function UpgradeButton({ tier }: { tier: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!MP_ENABLED) {
      alert("Pagamentos não disponíveis em dev. Configure NEXT_PUBLIC_MP_PUBLIC_KEY no .env.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/mp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plan", tier }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="block w-full rounded-xl border border-black/10 bg-black/[0.03] py-2.5 text-center text-[13px] font-semibold text-foreground shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.04)] transition hover:bg-foreground hover:text-white active:scale-[0.97] disabled:opacity-50"
    >
      {pending ? "Redirecionando…" : "Fazer upgrade"}
    </button>
  );
}

export function BoostButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!MP_ENABLED) {
      alert("Pagamentos não disponíveis em dev. Configure NEXT_PUBLIC_MP_PUBLIC_KEY no .env.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/mp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "boost" }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="mt-3 inline-block rounded-lg bg-coral px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
    >
      {pending ? "Redirecionando…" : "Disparar boost"}
    </button>
  );
}

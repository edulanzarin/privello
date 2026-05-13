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
      className="mt-5 block w-full border border-foreground py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground transition hover:bg-foreground hover:text-white disabled:opacity-50"
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
      className="mt-3 inline-block bg-coral px-5 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
    >
      {pending ? "Redirecionando…" : "Disparar boost"}
    </button>
  );
}

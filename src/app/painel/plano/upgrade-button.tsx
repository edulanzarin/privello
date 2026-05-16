"use client";

import { useTransition } from "react";
import { devActivatePlan, useFreeBoost } from "@/app/painel/_actions/provider-settings";

const IS_DEV = process.env.NODE_ENV !== "production";
const MP_ENABLED = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

export function UpgradeButton({ tier }: { tier: string }) {
  const [pending, startTransition] = useTransition();

  if (IS_DEV) {
    return (
      <form action={devActivatePlan}>
        <input type="hidden" name="tier" value={tier} />
        <button
          type="submit"
          className="block w-full rounded-xl border-2 border-dashed border-blue/40 bg-blue/[0.04] py-2.5 text-center text-base font-semibold text-blue transition hover:bg-blue/[0.08] active:scale-[0.97]"
        >
          Ativar grátis (dev)
        </button>
      </form>
    );
  }

  function handleClick() {
    if (!MP_ENABLED) {
      alert("Configure NEXT_PUBLIC_MP_PUBLIC_KEY no .env para ativar pagamentos.");
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
      className="block w-full rounded-xl border border-black/10 bg-black/[0.03] py-2.5 text-center text-base font-semibold text-foreground shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.04)] transition hover:bg-foreground hover:text-white active:scale-[0.97] disabled:opacity-50"
    >
      {pending ? "Redirecionando…" : "Fazer upgrade"}
    </button>
  );
}

export function FreeBoostButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await useFreeBoost();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
    >
      {pending ? "Ativando…" : "Usar boost grátis"}
    </button>
  );
}

export function BoostButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!MP_ENABLED) {
      alert("Configure NEXT_PUBLIC_MP_PUBLIC_KEY no .env para ativar pagamentos.");
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
      className="mt-3 inline-block rounded-lg bg-coral px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
    >
      {pending ? "Redirecionando…" : "Disparar boost"}
    </button>
  );
}

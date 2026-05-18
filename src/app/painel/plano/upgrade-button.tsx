"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  devActivatePlan,
  claimFreeBoost,
} from "@/app/painel/_actions/provider-settings";

const IS_DEV = process.env.NODE_ENV !== "production";
const MP_ENABLED = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

/**
 * UpgradeButton — Design System v2 (Tahoe Sensual).
 *
 * Variantes:
 *  - Em dev: form com fallback `devActivatePlan` (rose dashed outline).
 *  - Em prod: dispara `/api/mp/checkout`.
 *
 * Padroniza visual via `<Button>` primitivo (variant primary fullwidth).
 */
export function UpgradeButton({ tier }: { tier: string }) {
  const [pending, startTransition] = useTransition();

  if (IS_DEV) {
    return (
      <form action={devActivatePlan}>
        <input type="hidden" name="tier" value={tier} />
        <Button
          type="submit"
          variant="secondary"
          size="md"
          className="w-full border-dashed border-rose/40"
        >
          Ativar grátis (dev)
        </Button>
      </form>
    );
  }

  function handleClick() {
    if (!MP_ENABLED) {
      alert(
        "Configure NEXT_PUBLIC_MP_PUBLIC_KEY no .env para ativar pagamentos.",
      );
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/mp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plan", tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      loading={pending}
      variant="primary"
      size="md"
      className="w-full"
    >
      {pending ? "Redirecionando…" : "Fazer upgrade"}
    </Button>
  );
}

/**
 * FreeBoostButton — usado para Premium reivindicar boost grátis mensal.
 */
export function FreeBoostButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await claimFreeBoost();
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      loading={pending}
      variant="primary"
      size="md"
    >
      {pending ? "Ativando…" : "Usar boost grátis"}
    </Button>
  );
}

/**
 * BoostButton — disparo pago de boost (R$ 89 / 24h).
 */
export function BoostButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!MP_ENABLED) {
      alert(
        "Configure NEXT_PUBLIC_MP_PUBLIC_KEY no .env para ativar pagamentos.",
      );
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/mp/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "boost" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      loading={pending}
      variant="primary"
      size="md"
    >
      {pending ? "Redirecionando…" : "Disparar boost"}
    </Button>
  );
}

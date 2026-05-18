"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSubscriptionAction } from "@/app/_actions/subscription";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/constants";

const MP_ENABLED = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

/**
 * SubscribeButton — CTA principal do `/assinar`.
 *
 * Caminho: src/app/assinar/subscribe-button.tsx
 * Steering: `.kiro/steering/design-system.md` §6.3 (Button primary rose).
 *
 * Visual: usa `<Button>` primitivo (variant primary, size lg, fullwidth) —
 * mantém min-h-[44px] e ring rose canônicos. Substitui o `bg-coral` ad-hoc
 * da v1.
 *
 * Comportamento:
 * - Com `NEXT_PUBLIC_MP_PUBLIC_KEY`: dispara `/api/mp/checkout` e segue para
 *   o checkout do Mercado Pago.
 * - Sem MP: cai no path dev `createSubscriptionAction()` (ativa direto).
 */
export function SubscribeButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      if (MP_ENABLED) {
        const res = await fetch("/api/mp/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "subscription" }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (data.url) window.location.href = data.url;
      } else {
        const res = await createSubscriptionAction();
        if (res?.ok) router.push(redirectTo);
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      loading={pending}
      variant="primary"
      size="lg"
      className="w-full"
    >
      {pending ? "Ativando assinatura…" : `Assinar por ${SUBSCRIPTION_PRICE_LABEL}`}
    </Button>
  );
}

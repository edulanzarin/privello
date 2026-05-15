"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionAction } from "@/app/_actions/subscription";
import { SUBSCRIPTION_PRICE_LABEL } from "@/lib/constants";

const MP_ENABLED = !!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

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
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) window.location.href = data.url;
      } else {
        // Dev: ativa assinatura sem pagamento
        const res = await createSubscriptionAction();
        if (res?.ok) router.push(redirectTo);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full rounded-full bg-coral py-3.5 text-[14px] font-semibold text-white transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
    >
      {pending ? "Ativando assinatura…" : `Assinar por ${SUBSCRIPTION_PRICE_LABEL}`}
    </button>
  );
}

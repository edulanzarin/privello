"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionAction } from "@/app/_actions/subscription";

export function SubscribeButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const res = await createSubscriptionAction();
      if (res?.ok) router.push("/");
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full bg-coral py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-60"
    >
      {pending ? "Ativando assinatura…" : "Assinar por R$19,90/mês"}
    </button>
  );
}

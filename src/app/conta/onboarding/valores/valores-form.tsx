"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveOnboardingValores } from "@/app/_actions/onboarding";

type Profile = {
  priceHour: number;
  priceTwoHours: number | null;
  priceOvernight: number | null;
  priceTravelDay: number | null;
  paymentMethods: string | null;
};

export function ValoresForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveOnboardingValores(fd);
      if (res?.error) setError(res.error);
    });
  }

  const field = "w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground";
  const label = "block text-xs font-semibold uppercase tracking-wider text-muted mb-2";

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-6">
      {error && (
        <div className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      <div>
        <label className={label}>Valor por 1 hora <span className="text-coral">*</span></label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
          <input
            name="priceHour"
            type="number"
            required
            min={1}
            defaultValue={profile.priceHour || ""}
            placeholder="450"
            className={`${field} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className={label}>Valor por 2 horas <span className="text-muted font-normal normal-case">(opcional)</span></label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
          <input
            name="priceTwoHours"
            type="number"
            min={1}
            defaultValue={profile.priceTwoHours ?? ""}
            placeholder="800"
            className={`${field} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className={label}>Pernoite <span className="text-muted font-normal normal-case">(opcional)</span></label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
          <input
            name="priceOvernight"
            type="number"
            min={1}
            defaultValue={profile.priceOvernight ?? ""}
            placeholder="2500"
            className={`${field} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className={label}>Diária de viagem <span className="text-muted font-normal normal-case">(opcional)</span></label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
          <input
            name="priceTravelDay"
            type="number"
            min={1}
            defaultValue={profile.priceTravelDay ?? ""}
            placeholder="4000"
            className={`${field} pl-10`}
          />
        </div>
      </div>

      <div>
        <label className={label}>Formas de pagamento</label>
        <input
          name="paymentMethods"
          defaultValue={profile.paymentMethods ?? ""}
          placeholder="Pix · Dinheiro · Cartão"
          className={field}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <Link href="/conta/onboarding/fotos" className="border border-line bg-white px-6 py-3 text-sm">
          ← Voltar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Continuar →"}
        </button>
      </div>
    </form>
  );
}

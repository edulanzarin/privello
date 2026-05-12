"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDurationOptions } from "@/app/painel/_actions/provider-settings";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";


const DURATIONS = [
  { minutes: 30,   label: "30 min",  required: false },
  { minutes: 60,   label: "1 hora",  required: true  },
  { minutes: 120,  label: "2 horas", required: false },
  { minutes: 180,  label: "3 horas", required: false },
  { minutes: 240,  label: "4 horas", required: false },
  { minutes: 720,  label: "Pernoite",required: false },
  { minutes: 1440, label: "Diária",  required: false },
] as const;

const PAYMENT_OPTIONS = ["Pix", "Dinheiro", "Cartão de crédito", "Transferência", "Cripto"];

type DurationOption = { minutes: number; priceBrl: number };
type Profile = {
  priceHour: number;
  priceTwoHours: number | null;
  priceOvernight: number | null;
  priceTravelDay: number | null;
  paymentMethods: string | null;
  durationOptions: DurationOption[];
};

export function ValoresForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const byMin = new Map(profile.durationOptions.map((o) => [o.minutes, o]));

  const [enabled, setEnabled] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(DURATIONS.map((d) => [
      d.minutes,
      d.required || byMin.has(d.minutes),
    ]))
  );
  const [prices, setPrices] = useState<Record<number, number>>(() =>
    Object.fromEntries(DURATIONS.map((d) => [
      d.minutes,
      byMin.get(d.minutes)?.priceBrl
        ?? (d.minutes === 60 ? profile.priceHour : 0)
        ?? 0,
    ]))
  );
  const [payments, setPayments] = useState<string[]>(() =>
    profile.paymentMethods ? profile.paymentMethods.split(" · ").map((s) => s.trim()) : []
  );

  function togglePayment(p: string) {
    setPayments((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    let idx = 0;
    DURATIONS.forEach((d) => {
      if (!enabled[d.minutes] || !prices[d.minutes]) return;
      fd.set(`dur_${idx}_minutes`, String(d.minutes));
      fd.set(`dur_${idx}_label`,   d.label);
      fd.set(`dur_${idx}_price`,   String(prices[d.minutes]));
      idx++;
    });
    fd.set("paymentMethods", payments.join(" · "));
    startTransition(async () => {
      await saveDurationOptions(fd);
      toast("Valores salvos.");
      router.refresh();
    });
  }

  const sel = "w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-foreground transition cursor-pointer disabled:bg-line disabled:text-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Durações */}
      <div className="border border-line bg-white">
        <div className="border-b border-line px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wider">Durações e valores</p>
          <p className="mt-1 text-xs text-muted">Ative as durações que você oferece e defina o valor de cada uma.</p>
        </div>
        <div className="divide-y divide-line">
          {DURATIONS.map((d) => (
            <div key={d.minutes} className="flex items-center gap-4 px-6 py-4">
              <button
                type="button"
                disabled={d.required}
                onClick={() => !d.required && setEnabled((p) => ({ ...p, [d.minutes]: !p[d.minutes] }))}
                className={cn(
                  "flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  enabled[d.minutes] ? "bg-coral" : "bg-line",
                  d.required && "opacity-60 cursor-not-allowed",
                )}
              >
                <span className={cn(
                  "ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                  enabled[d.minutes] && "translate-x-4",
                )} />
              </button>
              <span className={cn(
                "w-20 shrink-0 text-sm font-semibold",
                !enabled[d.minutes] && "text-muted",
              )}>
                {d.label}
                {d.required && <span className="ml-1 text-coral">*</span>}
              </span>
              <div className="relative max-w-[180px]">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">R$</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  disabled={!enabled[d.minutes]}
                  value={prices[d.minutes] || ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [d.minutes]: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-foreground transition disabled:bg-line disabled:text-muted"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagamentos */}
      <div className="border border-line bg-white">
        <div className="border-b border-line px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wider">Formas de pagamento</p>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-5">
          {PAYMENT_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePayment(p)}
              className={cn(
                "border px-4 py-2 text-sm font-medium transition",
                payments.includes(p)
                  ? "border-foreground bg-foreground text-white"
                  : "border-line bg-white text-muted hover:border-foreground/30",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Salvar valores"}
      </button>
    </form>
  );
}

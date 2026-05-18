"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const AGE_KEY = "privello:age_ok";

/**
 * AgeGate — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/age-gate.tsx
 * Steering: `.kiro/steering/design-system.md` §4.3 (Inter Bold display),
 * §3.3 (rose accent), §13.1 (BottomNav cobre safe-area, gate vai por cima).
 *
 * Modal full-screen +18 sobre fundo preto imersivo (padrão mercado adulto).
 * Tipografia em Inter Bold (não font-serif), CTAs com ring rose canônico.
 * Persiste decisão em `localStorage["privello:age_ok"]`.
 */
export function AgeGate() {
  const [show, setShow] = useState(false);

  // Mount-time check: leitura de localStorage que decide se o gate deve aparecer.
  // setState dentro de useEffect síncrono é o padrão idiomático para "ler API
  // do browser uma vez ao montar". Não pode rodar durante render (SSR não tem
  // localStorage) nem em event handler (não há evento de mount).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time browser API check
      if (!localStorage.getItem(AGE_KEY)) setShow(true);
    } catch {
      // localStorage blocked (private mode etc.) — don't block
    }
  }, []);

  function confirm() {
    try {
      localStorage.setItem(AGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black px-6 text-center"
    >
      {/* Logo + selo +18 */}
      <p className="text-2xl font-bold tracking-[-0.022em] text-white">
        privello<span className="text-rose">.</span>
      </p>
      <p className="mt-1 text-2xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Conteúdo adulto · +18
      </p>

      <div className="mt-10 max-w-xs">
        <h1
          id="age-gate-title"
          className="text-2xl font-bold leading-[1.15] tracking-[-0.022em] text-white"
        >
          Você tem 18 anos ou mais?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Este site contém conteúdo de natureza adulta destinado exclusivamente a maiores de
          idade. Ao entrar, você confirma ter 18 anos ou mais e aceita os termos do site.
        </p>
      </div>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
        <button
          type="button"
          onClick={confirm}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose px-6 py-3 text-md font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-tahoe)] hover:brightness-105 active:brightness-95 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Tenho 18 anos — Entrar
        </button>
        <a
          href="https://www.google.com"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-md font-medium text-white/60 transition-all duration-150 hover:border-white/35 hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Sou menor de idade — Sair
        </a>
      </div>

      <p className="mt-8 text-2xs text-white/30">
        <Link
          href="/politica-de-privacidade"
          className="underline-offset-2 hover:text-white/60 hover:underline"
        >
          Política de privacidade
        </Link>
        {" · "}
        <Link
          href="/termos-de-uso"
          className="underline-offset-2 hover:text-white/60 hover:underline"
        >
          Termos de uso
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const AGE_KEY = "privello:age_ok";

export function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(AGE_KEY)) setShow(true);
    } catch {
      // localStorage blocked (private mode etc.) — don't block
    }
  }, []);

  function confirm() {
    try { localStorage.setItem(AGE_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-black px-6 text-center">
      {/* Logo */}
      <p className="text-2xl font-black tracking-tight text-white">
        privello<span className="text-coral">.</span>
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/30">
        Conteúdo adulto · +18
      </p>

      <div className="mt-10 max-w-xs">
        <h1 className="text-xl font-bold text-white">Você tem 18 anos ou mais?</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          Este site contém conteúdo de natureza adulta destinado exclusivamente a maiores de idade.
          Ao entrar, você confirma ter 18 anos ou mais e aceita os termos do site.
        </p>
      </div>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={confirm}
          className="rounded-full bg-coral py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97]"
        >
          Tenho 18 anos — Entrar
        </button>
        <a
          href="https://www.google.com"
          className="rounded-full border border-white/15 py-3 text-sm font-semibold text-white/50 transition hover:border-white/30 hover:text-white/70"
        >
          Sou menor de idade — Sair
        </a>
      </div>

      <p className="mt-8 text-2xs text-white/20">
        <Link href="/politica-de-privacidade" className="underline underline-offset-2">
          Política de privacidade
        </Link>
        {" · "}
        <Link href="/termos-de-uso" className="underline underline-offset-2">
          Termos de uso
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Camera, CheckCircle, Clock, Lock, Shield, Upload, X } from "lucide-react";
import { submitVerificationCase } from "@/app/_actions/verification";
import { cn } from "@/lib/utils";

type UploadSlot = {
  key: "documentFrontUrl" | "documentBackUrl" | "selfieUrl";
  label: string;
  hint: string;
};

const SLOTS: UploadSlot[] = [
  { key: "documentFrontUrl", label: "Frente do documento", hint: "RG ou CNH — foto nítida, sem reflexos." },
  { key: "documentBackUrl",  label: "Verso do documento",  hint: "Verifique se os dados estão legíveis." },
  { key: "selfieUrl",        label: "Selfie com documento", hint: "Segure o documento ao lado do rosto." },
];

type SlotState = { url: string; uploading: boolean; error?: string };
type SlotMap = Record<string, SlotState>;

export default function ContaVerificacaoPage() {
  const [slots, setSlots] = useState<SlotMap>({});
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function uploadFile(key: string, file: File) {
    setSlots((s) => ({ ...s, [key]: { url: "", uploading: true } }));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/verification", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSlots((s) => ({ ...s, [key]: { url: "", uploading: false, error: data.error ?? "Erro no upload." } }));
      } else {
        setSlots((s) => ({ ...s, [key]: { url: data.url, uploading: false } }));
      }
    } catch {
      setSlots((s) => ({ ...s, [key]: { url: "", uploading: false, error: "Erro de conexão." } }));
    }
  }

  function handleFileChange(key: string, files: FileList | null) {
    if (!files?.[0]) return;
    uploadFile(key, files[0]);
  }

  function clearSlot(key: string) {
    setSlots((s) => { const n = { ...s }; delete n[key]; return n; });
    if (inputRefs.current[key]) inputRefs.current[key]!.value = "";
  }

  function handleSubmit() {
    setSubmitError(null);
    const fd = new FormData();
    for (const slot of SLOTS) {
      fd.set(slot.key, slots[slot.key]?.url ?? "");
    }
    startTransition(async () => {
      const res = await submitVerificationCase(fd);
      if (res.error) setSubmitError(res.error);
      else setSubmitted(true);
    });
  }

  const allDone = SLOTS.every((s) => slots[s.key]?.url);
  const anyUploading = SLOTS.some((s) => slots[s.key]?.uploading);

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-6 py-16 text-center">
          <CheckCircle className="h-12 w-12 text-success" strokeWidth={1.5} />
          <h2 className="font-serif text-3xl">Enviado para revisão</h2>
          <p className="max-w-sm text-sm text-muted">
            Nossa equipe vai analisar seus documentos em até 24 horas. Você receberá uma notificação quando o processo for concluído.
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Clock className="h-4 w-4" strokeWidth={1.5} />
            <span>Prazo: até 24h</span>
          </div>
          <Link href="/painel" className="mt-4 bg-foreground px-8 py-3 text-xs font-bold uppercase tracking-wider text-white">
            Voltar ao painel
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 bg-background px-6 py-12 md:px-16">
        <h2 className="font-serif text-3xl md:text-4xl">
          Confirme que é você<span className="text-coral">.</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Três envios. Você precisa estar com seu documento original em mãos.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SLOTS.map((slot) => {
            const state = slots[slot.key];
            const done = !!state?.url;
            const uploading = !!state?.uploading;
            const error = state?.error;

            return (
              <div
                key={slot.key}
                className={cn(
                  "relative border-2 bg-white p-6",
                  done ? "border-success" : error ? "border-coral" : "border-line",
                )}
              >
                {done && (
                  <span className="float-right text-[10px] font-bold uppercase text-success">Recebido</span>
                )}
                <p className="text-sm font-semibold">{slot.label}</p>
                <p className="mt-2 text-xs text-muted">{slot.hint}</p>

                {done ? (
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                      Arquivo enviado
                    </p>
                    <button
                      type="button"
                      onClick={() => clearSlot(slot.key)}
                      className="text-muted hover:text-coral"
                      title="Remover"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="mt-4">
                    <div className="h-1 w-full animate-pulse rounded bg-coral/40" />
                    <p className="mt-2 text-xs text-muted">Enviando…</p>
                  </div>
                ) : (
                  <>
                    {error && <p className="mt-2 text-xs text-coral">{error}</p>}
                    <button
                      type="button"
                      onClick={() => inputRefs.current[slot.key]?.click()}
                      className="mt-4 flex w-full items-center justify-center gap-2 border border-line bg-[#faf8f4] py-2.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-line"
                    >
                      <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Enviar foto
                    </button>
                    <input
                      ref={(el) => { inputRefs.current[slot.key] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => handleFileChange(slot.key, e.target.files)}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 border border-line bg-[#faf8f4] p-6 text-xs text-muted md:grid-cols-3">
          <div className="flex gap-2">
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Criptografia AES-256 — imagens cifradas no envio e no servidor.</span>
          </div>
          <div className="flex gap-2">
            <Shield className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Acesso restrito — apenas moderação, auditável.</span>
          </div>
          <div className="flex gap-2">
            <Camera className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Exclusão automática — removidos 30 dias após aprovação.</span>
          </div>
        </div>

        {submitError && (
          <p className="mt-4 text-sm text-coral">{submitError}</p>
        )}

        <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link href="/conta/onboarding/fotos" className="border border-line bg-white px-6 py-3 text-center text-sm">
            Voltar
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allDone || anyUploading || pending}
            className="flex items-center justify-center gap-2 bg-foreground px-8 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Enviando…" : "Enviar para revisão"}
          </button>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-full flex-col justify-between bg-sidebar px-8 py-12 text-white md:max-w-sm md:min-h-screen">
      <div>
        <p className="font-serif text-lg">
          privello<span className="text-coral">.</span>
        </p>
        <h1 className="mt-10 font-serif text-3xl">Verificação</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/75">
          Comparamos sua selfie com o documento. Aprovação em até 24h. Documentos são criptografados e nunca publicados.
        </p>
      </div>
      <div className="mt-10 rounded border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/70 md:mt-0">
        Imagens enviadas com AES-256 ponta a ponta. Apagamos automaticamente após 30 dias da aprovação.
      </div>
    </aside>
  );
}

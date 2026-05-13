"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  Camera, CheckCircle, Clock, Lock, Shield, Upload, X,
  FileText, Video, BadgeCheck, ChevronRight, AlertCircle,
} from "lucide-react";
import { submitVerificationCase } from "@/app/_actions/verification";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type FieldKey = "documentFrontUrl" | "documentBackUrl" | "selfieUrl" | "videoUrl";

type SlotState = { url: string; uploading: boolean; error?: string; previewObjectUrl?: string };
type SlotMap = Partial<Record<FieldKey, SlotState>>;

// ── Steps definition ─────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: "Documento",
    subtitle: "Frente e verso",
    icon: FileText,
    seal: "Identidade verificada",
    sealIcon: BadgeCheck,
    sealColor: "text-emerald-600",
    description: "Fotografe a frente e o verso do seu RG ou CNH. O documento precisa estar nítido, sem reflexos ou partes cortadas.",
    fields: [
      { key: "documentFrontUrl" as FieldKey, label: "Frente do documento", hint: "RG ou CNH — foto nítida, sem reflexos.", accept: "image/*" },
      { key: "documentBackUrl"  as FieldKey, label: "Verso do documento",  hint: "Verifique se CPF e data de nascimento estão legíveis.", accept: "image/*" },
    ],
  },
  {
    id: 2,
    title: "Selfie",
    subtitle: "Com documento",
    icon: Camera,
    seal: "Identidade verificada",
    sealIcon: BadgeCheck,
    sealColor: "text-emerald-600",
    description: "Segure o documento ao lado do rosto, sem cobrir o rosto. Boa iluminação, fundo neutro. Foto frontal.",
    fields: [
      { key: "selfieUrl" as FieldKey, label: "Selfie segurando o documento", hint: "Rosto e documento visíveis ao mesmo tempo.", accept: "image/*" },
    ],
  },
  {
    id: 3,
    title: "Vídeo",
    subtitle: "Verificação de presença",
    icon: Video,
    seal: "Vídeo verificado",
    sealIcon: Video,
    sealColor: "text-blue-600",
    optional: true,
    description: "Grave um vídeo curto (5–15 segundos) olhando para a câmera e dizendo em voz alta: \"Eu, [seu nome], confirmo minha identidade no Privello.\" Adiciona o selo de Vídeo Verificado ao seu perfil.",
    fields: [
      { key: "videoUrl" as FieldKey, label: "Vídeo de verificação", hint: "MP4 ou MOV, máx. 150 MB, 5–15 segundos.", accept: "video/mp4,video/quicktime,video/webm" },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContaVerificacaoPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<SlotMap>({});
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>({});

  async function uploadFile(key: FieldKey, file: File) {
    const previewObjectUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setSlots((s) => ({ ...s, [key]: { url: "", uploading: true, previewObjectUrl } }));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/verification", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSlots((s) => ({ ...s, [key]: { url: "", uploading: false, error: data.error ?? "Erro no upload.", previewObjectUrl } }));
      } else {
        setSlots((s) => ({ ...s, [key]: { url: data.url, uploading: false, previewObjectUrl } }));
      }
    } catch {
      setSlots((s) => ({ ...s, [key]: { url: "", uploading: false, error: "Erro de conexão.", previewObjectUrl } }));
    }
  }

  function clearSlot(key: FieldKey) {
    setSlots((s) => {
      const n = { ...s };
      if (n[key]?.previewObjectUrl) URL.revokeObjectURL(n[key]!.previewObjectUrl!);
      delete n[key];
      return n;
    });
    if (inputRefs.current[key]) inputRefs.current[key]!.value = "";
  }

  function handleSubmit() {
    setSubmitError(null);
    const fd = new FormData();
    for (const s of STEPS) {
      for (const f of s.fields) {
        fd.set(f.key, slots[f.key]?.url ?? "");
      }
    }
    startTransition(async () => {
      const res = await submitVerificationCase(fd);
      if (res.error) setSubmitError(res.error);
      else setSubmitted(true);
    });
  }

  const currentStep = STEPS[step - 1];
  const stepDone = (s: typeof STEPS[0]) =>
    s.fields.every((f) => s.optional ? true : !!slots[f.key]?.url);
  const requiredDone = STEPS.filter((s) => !s.optional).every(stepDone);

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar step={step} />
        <main className="flex flex-1 flex-col items-center justify-center gap-5 bg-background px-6 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-3xl">Enviado para revisão</h2>
          <p className="max-w-sm text-sm text-muted leading-relaxed">
            Nossa equipe vai analisar seus documentos em até 24 horas. Você receberá uma notificação quando o processo for concluído.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock className="h-4 w-4" strokeWidth={1.5} />
            <span>Prazo: até 24h úteis</span>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {slots.videoUrl?.url ? (
              <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                <Video className="h-3.5 w-3.5" strokeWidth={2} />
                Vídeo de verificação enviado — selo em análise
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Identidade em análise
            </div>
          </div>
          <Link href="/painel" className="mt-4 bg-foreground px-10 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-foreground/80 transition">
            Voltar ao painel
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar step={step} />

      <main className="flex-1 bg-background px-5 py-10 md:px-14 md:py-14">

        {/* ── Step nav ── */}
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = stepDone(s);
            const active = s.id === step;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-semibold transition rounded",
                    active ? "bg-foreground text-white" :
                    done ? "text-emerald-700 bg-emerald-50 border border-emerald-200" :
                    "text-muted border border-line hover:border-foreground/30 bg-white",
                  )}
                >
                  {done && !active ? (
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  ) : (
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  )}
                  <span className="hidden sm:block">{s.title}</span>
                  <span className="sm:hidden">{s.id}</span>
                  {s.optional && <span className="hidden sm:block text-[9px] opacity-60">(opcional)</span>}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted/40 shrink-0" strokeWidth={1.5} />}
              </div>
            );
          })}
        </div>

        {/* ── Step header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-white">
              <currentStep.icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-2xl leading-none">
                {currentStep.title}<span className="text-coral">.</span>
              </h2>
              <p className="text-xs text-muted mt-0.5">{currentStep.subtitle}</p>
            </div>

            {/* Seal unlocked by this step */}
            <div className={cn("ml-auto hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider",
              currentStep.id === 3 ? "border-blue-200 bg-blue-50 text-blue-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}>
              <currentStep.sealIcon className="h-3 w-3" strokeWidth={2} />
              {currentStep.seal}
              {currentStep.optional && <span className="opacity-60 ml-0.5 normal-case font-normal">· opcional</span>}
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed max-w-xl">{currentStep.description}</p>
        </div>

        {/* ── Upload slots ── */}
        <div className={cn("grid gap-4", currentStep.fields.length > 1 ? "md:grid-cols-2" : "max-w-sm")}>
          {currentStep.fields.map((field) => {
            const state = slots[field.key];
            const done = !!state?.url;
            const uploading = !!state?.uploading;
            const error = state?.error;
            const preview = state?.previewObjectUrl;

            return (
              <div
                key={field.key}
                className={cn(
                  "relative border-2 bg-white overflow-hidden",
                  done ? "border-emerald-400" : error ? "border-coral" : "border-line",
                )}
              >
                {/* Preview thumbnail */}
                {preview && done && (
                  <div className="relative h-40 w-full bg-zinc-100">
                    <Image src={preview} alt="" fill className="object-cover" sizes="400px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold text-white">
                      <CheckCircle className="h-3 w-3" strokeWidth={2} /> Recebido
                    </span>
                  </div>
                )}

                {/* Video placeholder */}
                {field.accept.startsWith("video") && done && !preview && (
                  <div className="h-32 flex items-center justify-center bg-zinc-900 gap-2 text-white/60 text-xs">
                    <Video className="h-6 w-6" strokeWidth={1.5} />
                    Vídeo enviado
                  </div>
                )}

                <div className="p-5">
                  <p className="text-sm font-semibold">{field.label}</p>
                  <p className="mt-1 text-[11px] text-muted">{field.hint}</p>

                  {done ? (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                        <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                        Arquivo enviado
                      </p>
                      <button type="button" onClick={() => clearSlot(field.key)} className="text-muted hover:text-coral transition">
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : uploading ? (
                    <div className="mt-4">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-line">
                        <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] bg-coral/60 rounded-full" />
                      </div>
                      <p className="mt-2 text-xs text-muted">Enviando…</p>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-coral">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                          {error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => inputRefs.current[field.key]?.click()}
                        className="mt-4 flex w-full items-center justify-center gap-2 border border-line bg-zinc-50 py-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-line transition"
                      >
                        <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {field.accept.startsWith("video") ? "Enviar vídeo" : "Enviar foto"}
                      </button>
                      <input
                        ref={(el) => { inputRefs.current[field.key] = el; }}
                        type="file"
                        accept={field.accept}
                        className="sr-only"
                        onChange={(e) => { if (e.target.files?.[0]) uploadFile(field.key, e.target.files[0]); }}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Security note ── */}
        <div className="mt-8 grid gap-3 border border-line bg-zinc-50 p-5 text-[11px] text-muted sm:grid-cols-3">
          <div className="flex gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>Criptografia AES-256 — imagens cifradas no envio e no servidor.</span>
          </div>
          <div className="flex gap-2">
            <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>Acesso restrito — apenas moderação interna, auditável.</span>
          </div>
          <div className="flex gap-2">
            <Camera className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>Exclusão automática — removidos 30 dias após aprovação.</span>
          </div>
        </div>

        {/* ── Actions ── */}
        {submitError && (
          <div className="mt-5 flex items-center gap-2 text-sm text-coral">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {submitError}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="border border-line bg-white px-5 py-2.5 text-sm font-medium hover:bg-line transition">
                ← Voltar
              </button>
            )}
            {step === 1 && (
              <Link href="/painel" className="border border-line bg-white px-5 py-2.5 text-sm font-medium text-center hover:bg-line transition">
                Cancelar
              </Link>
            )}
          </div>

          <div className="flex gap-2">
            {step < STEPS.length ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!stepDone(currentStep)}
                className="flex items-center gap-2 bg-foreground px-8 py-2.5 text-sm font-semibold text-white hover:bg-foreground/80 transition disabled:opacity-40"
              >
                Próximo <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!requiredDone || pending}
                className="flex items-center gap-2 bg-foreground px-8 py-2.5 text-sm font-semibold text-white hover:bg-foreground/80 transition disabled:opacity-40"
              >
                {pending ? "Enviando…" : "Enviar para revisão"}
                {!pending && <CheckCircle className="h-4 w-4" strokeWidth={2} />}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ step }: { step: number }) {
  return (
    <aside className="flex w-full flex-col bg-sidebar px-8 py-12 text-white md:max-w-xs md:min-h-screen md:sticky md:top-0 md:h-screen md:overflow-auto">
      <div>
        <p className="font-serif text-lg">
          privello<span className="text-coral">.</span>
        </p>
        <h1 className="mt-10 font-serif text-3xl leading-snug">
          Verificação de identidade
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Complete as etapas para receber seus selos de confiança e aparecer com destaque no Privello.
        </p>
      </div>

      {/* Seals preview */}
      <div className="mt-10 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Selos que você recebe</p>

        <div className={cn("flex items-center gap-3 rounded border border-white/10 bg-white/5 p-3 transition", step >= 1 ? "opacity-100" : "opacity-40")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <BadgeCheck className="h-4 w-4 text-emerald-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold">Identidade verificada</p>
            <p className="text-[10px] text-white/50">Documento + selfie — etapas 1 e 2</p>
          </div>
        </div>

        <div className={cn("flex items-center gap-3 rounded border border-white/10 bg-white/5 p-3 transition", step >= 3 ? "opacity-100" : "opacity-40")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
            <Video className="h-4 w-4 text-blue-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold">Vídeo verificado</p>
            <p className="text-[10px] text-white/50">Vídeo curto de presença — etapa 3</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-10 text-[11px] leading-relaxed text-white/40">
        Imagens enviadas com AES-256 ponta a ponta. Apagamos automaticamente após 30 dias da aprovação.
      </div>
    </aside>
  );
}

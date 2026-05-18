"use client";

/**
 * Página Client — Verificação de identidade — Design System v2 (Tahoe Sensual).
 *
 * Rota: `/painel/verificacao` (movida de `/conta/verificacao` em 2026-05-18 para
 * herdar o shell do painel — sidebar/hamburger persistem, BottomNav escondida).
 * Tipo: Client Component.
 * Auth: acompanhante (PROVIDER) — gate efetivo no server action
 *  `submitVerificationCase` e nos uploads de `/api/upload/verification`.
 *
 * Visual v2:
 * - Sem hero ink lateral (legacy v1). Layout single-column dentro do shell
 *   `<PainelLayout>` que já tem sidebar + hamburger.
 * - Header com eyebrow uppercase tracking-wider + título Inter Bold + subtítulo
 *   no padrão do resto do painel.
 * - Selos em pílulas `success-soft`/`info-soft` no topo (substituem o card
 *   escuro do hero).
 * - Steps stepper rose-active, hairline neutral.
 * - Upload slots em `<Card variant="solid">` rounded-2xl + dashed dropzone
 *   rose-soft hover.
 *
 * Cross-refs:
 *  - src/app/_actions/verification.ts (submitVerificationCase)
 *  - src/app/api/upload/verification/route.ts
 */
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
    AlertCircle,
    BadgeCheck,
    Camera,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    Lock,
    Shield,
    Upload,
    Video,
    X,
} from "lucide-react";
import { submitVerificationCase } from "@/app/_actions/verification";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type FieldKey =
    | "documentFrontUrl"
    | "documentBackUrl"
    | "selfieUrl"
    | "videoUrl";
type SlotState = {
    url: string;
    uploading: boolean;
    error?: string;
    previewObjectUrl?: string;
};
type SlotMap = Partial<Record<FieldKey, SlotState>>;

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
    {
        id: 1,
        title: "Documento",
        subtitle: "Frente e verso",
        icon: FileText,
        description:
            "Fotografe a frente e o verso do seu RG ou CNH. O documento precisa estar nítido, sem reflexos ou partes cortadas.",
        fields: [
            {
                key: "documentFrontUrl" as FieldKey,
                label: "Frente do documento",
                hint: "RG ou CNH — foto nítida, sem reflexos.",
                accept: "image/*",
            },
            {
                key: "documentBackUrl" as FieldKey,
                label: "Verso do documento",
                hint: "Verifique se CPF e data de nascimento estão legíveis.",
                accept: "image/*",
            },
        ],
    },
    {
        id: 2,
        title: "Selfie",
        subtitle: "Com documento",
        icon: Camera,
        description:
            "Segure o documento ao lado do rosto, sem cobrir o rosto. Boa iluminação, fundo neutro. Foto frontal.",
        fields: [
            {
                key: "selfieUrl" as FieldKey,
                label: "Selfie segurando o documento",
                hint: "Rosto e documento visíveis ao mesmo tempo.",
                accept: "image/*",
            },
        ],
    },
    {
        id: 3,
        title: "Vídeo",
        subtitle: "Verificação de presença",
        icon: Video,
        optional: true,
        description:
            'Grave um vídeo curto (5–15 s) olhando para a câmera e dizendo: "Eu, [seu nome], confirmo minha identidade no Privello." Adiciona o selo de Vídeo Verificado.',
        fields: [
            {
                key: "videoUrl" as FieldKey,
                label: "Vídeo de verificação",
                hint: "MP4 ou MOV, máx. 150 MB, 5–15 segundos.",
                accept: "video/mp4,video/quicktime,video/webm",
            },
        ],
    },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function PainelVerificacaoPage() {
    const [step, setStep] = useState(1);
    const [slots, setSlots] = useState<SlotMap>({});
    const [pending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const inputRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>(
        {},
    );

    const pendingKeyRef = useRef<FieldKey | null>(null);
    const pendingPreviewRef = useRef<string | undefined>(undefined);
    const { upload } = useFileUpload({
        endpoint: "/api/upload/verification",
        onError: (msg) => {
            const key = pendingKeyRef.current;
            const previewObjectUrl = pendingPreviewRef.current;
            if (key) {
                setSlots((s) => ({
                    ...s,
                    [key]: { url: "", uploading: false, error: msg, previewObjectUrl },
                }));
            }
        },
    });

    async function uploadFile(key: FieldKey, file: File) {
        const previewObjectUrl = file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined;
        setSlots((s) => ({
            ...s,
            [key]: { url: "", uploading: true, previewObjectUrl },
        }));
        pendingKeyRef.current = key;
        pendingPreviewRef.current = previewObjectUrl;
        const data = await upload(file);
        if (data?.url) {
            setSlots((s) => ({
                ...s,
                [key]: {
                    url: data.url as string,
                    uploading: false,
                    previewObjectUrl,
                },
            }));
        }
        pendingKeyRef.current = null;
        pendingPreviewRef.current = undefined;
    }

    function clearSlot(key: FieldKey) {
        setSlots((s) => {
            const n = { ...s };
            if (n[key]?.previewObjectUrl) {
                URL.revokeObjectURL(n[key]!.previewObjectUrl!);
            }
            delete n[key];
            return n;
        });
        if (inputRefs.current[key]) {
            inputRefs.current[key]!.value = "";
        }
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
    const stepDone = (s: (typeof STEPS)[0]) =>
        s.fields.every((f) => (s.optional ? true : !!slots[f.key]?.url));
    const requiredDone = STEPS.filter((s) => !s.optional).every(stepDone);
    const progress = Math.round((step / STEPS.length) * 100);

    // ── Submitted state ──
    if (submitted) {
        return (
            <div className="mx-auto max-w-md space-y-6 py-12 text-center">
                <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success shadow-[var(--shadow-sm)]">
                    <CheckCircle className="h-8 w-8" strokeWidth={2} />
                </span>
                <div>
                    <h1 className="text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
                        Enviado para revisão
                    </h1>
                    <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-ink-dim">
                        Nossa equipe vai analisar seus documentos em até 24 horas. Você
                        receberá uma notificação quando o processo for concluído.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs text-ink-dim shadow-[var(--shadow-sm)]">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Prazo: até 24h úteis
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    {slots.videoUrl?.url && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info-soft px-4 py-2 text-xs font-semibold text-info">
                            <Video className="h-3.5 w-3.5" strokeWidth={2} />
                            Vídeo enviado — selo em análise
                        </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success-soft px-4 py-2 text-xs font-semibold text-success">
                        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                        Identidade em análise
                    </span>
                </div>
                <Button href="/painel" variant="primary" size="lg">
                    Voltar ao painel
                </Button>
            </div>
        );
    }

    // ── Wizard ──
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header padrão do painel */}
            <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Verificação · Identidade
                </p>
                <h1 className="mt-1.5 text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
                    Receba seus selos
                    <span className="text-rose">.</span>
                </h1>
                <p className="mt-2 text-md text-ink-dim">
                    Complete as etapas para destacar seu perfil e ganhar mais visibilidade.
                </p>
            </div>

            {/* Selos disponíveis */}
            <div className="grid gap-3 sm:grid-cols-2">
                <Card
                    variant="success-subtle"
                    padding="md"
                    className="flex items-center gap-3"
                >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                        <BadgeCheck className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-success">
                            Identidade verificada
                        </p>
                        <p className="text-2xs text-success/80">
                            Documento + selfie · etapas 1 e 2
                        </p>
                    </div>
                </Card>
                <Card
                    variant="solid"
                    padding="md"
                    className="flex items-center gap-3 border-info/20 bg-info-soft"
                >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info/15 text-info">
                        <Video className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-info">
                            Vídeo verificado
                        </p>
                        <p className="text-2xs text-info/80">
                            Vídeo curto de presença · etapa 3 (opcional)
                        </p>
                    </div>
                </Card>
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-sm)]">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                        Progresso
                    </p>
                    <span className="text-2xs font-bold tabular-nums text-rose">
                        {progress}%
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/50">
                    <div
                        className="h-full rounded-full bg-rose transition-all duration-500 ease-[var(--ease-tahoe)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
                {STEPS.map((s, i) => {
                    const done = stepDone(s);
                    const active = s.id === step;
                    const Icon = s.icon;
                    return (
                        <div key={s.id} className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setStep(s.id)}
                                className={cn(
                                    "inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                                    "transition-all duration-150 ease-[var(--ease-tahoe)]",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                    active && "bg-rose text-white shadow-[var(--shadow-sm)]",
                                    !active && done &&
                                    "border border-success/30 bg-success-soft text-success hover:bg-success/15",
                                    !active && !done &&
                                    "border border-line bg-white text-ink-dim hover:border-rose/30 hover:text-ink",
                                )}
                                aria-current={active ? "step" : undefined}
                            >
                                {done && !active ? (
                                    <CheckCircle
                                        className="h-3.5 w-3.5 shrink-0"
                                        strokeWidth={2.4}
                                    />
                                ) : (
                                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                )}
                                {s.title}
                                {s.optional && (
                                    <span className="text-2xs opacity-60">(opcional)</span>
                                )}
                            </button>
                            {i < STEPS.length - 1 && (
                                <ChevronRight
                                    className="h-3 w-3 shrink-0 text-ink-faint"
                                    strokeWidth={2}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step header */}
            <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-soft text-rose">
                    <currentStep.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                    <h2 className="text-xl font-bold tracking-[-0.022em] text-ink sm:text-2xl">
                        {currentStep.title}
                        <span className="text-rose">.</span>
                    </h2>
                    <p className="mt-0.5 text-sm text-ink-dim">
                        {currentStep.subtitle}
                    </p>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-dim">
                        {currentStep.description}
                    </p>
                </div>
            </div>

            {/* Upload slots */}
            <div
                className={cn(
                    "grid gap-4",
                    currentStep.fields.length > 1 ? "md:grid-cols-2" : "max-w-md",
                )}
            >
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
                                "relative overflow-hidden rounded-2xl border bg-white shadow-[var(--shadow-sm)] transition-all duration-150",
                                done
                                    ? "border-success/40"
                                    : error
                                        ? "border-danger/40"
                                        : "border-line",
                            )}
                        >
                            {preview && done && (
                                <div className="relative h-44 w-full bg-line/40">
                                    <Image
                                        src={preview}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="400px"
                                    />
                                    <div
                                        className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent"
                                        aria-hidden
                                    />
                                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
                                        <CheckCircle className="h-3 w-3" strokeWidth={2.4} />
                                        Recebido
                                    </span>
                                </div>
                            )}
                            {field.accept.startsWith("video") && done && !preview && (
                                <div className="flex h-36 items-center justify-center gap-2 rounded-t-2xl bg-ink text-xs text-white/70">
                                    <Video className="h-6 w-6" strokeWidth={1.75} />
                                    Vídeo enviado
                                </div>
                            )}
                            <div className="p-5">
                                <p className="text-base font-semibold text-ink">
                                    {field.label}
                                </p>
                                <p className="mt-1 text-xs text-ink-dim">{field.hint}</p>
                                {done ? (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                                            <CheckCircle
                                                className="h-3.5 w-3.5"
                                                strokeWidth={2.4}
                                            />
                                            Arquivo enviado
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => clearSlot(field.key)}
                                            aria-label="Remover arquivo"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-line/40 hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        >
                                            <X className="h-4 w-4" strokeWidth={2} />
                                        </button>
                                    </div>
                                ) : uploading ? (
                                    <div className="mt-4">
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/40">
                                            <div className="h-full w-2/3 animate-pulse rounded-full bg-rose/60" />
                                        </div>
                                        <p className="mt-2 text-xs text-ink-dim">
                                            Enviando…
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {error && (
                                            <Card
                                                variant="danger-subtle"
                                                padding="sm"
                                                className="mt-3 flex items-center gap-2 text-xs text-danger"
                                            >
                                                <AlertCircle
                                                    className="h-3.5 w-3.5 shrink-0"
                                                    strokeWidth={2}
                                                />
                                                {error}
                                            </Card>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                inputRefs.current[field.key]?.click()
                                            }
                                            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-line/20 py-4 text-sm font-medium text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)] hover:border-rose/40 hover:bg-rose-soft hover:text-rose active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        >
                                            <Upload className="h-4 w-4" strokeWidth={2} />
                                            {field.accept.startsWith("video")
                                                ? "Enviar vídeo"
                                                : "Enviar foto"}
                                        </button>
                                        <input
                                            ref={(el) => {
                                                inputRefs.current[field.key] = el;
                                            }}
                                            type="file"
                                            accept={field.accept}
                                            className="sr-only"
                                            onChange={(e) => {
                                                if (e.target.files?.[0])
                                                    uploadFile(field.key, e.target.files[0]);
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Security note */}
            <Card variant="solid" padding="md" className="bg-line/20">
                <div className="grid gap-3 text-xs text-ink-dim sm:grid-cols-3">
                    <div className="flex gap-2.5">
                        <Lock
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-dim"
                            strokeWidth={1.75}
                        />
                        <span>
                            Criptografia AES-256 — imagens cifradas no envio e no servidor.
                        </span>
                    </div>
                    <div className="flex gap-2.5">
                        <Shield
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-dim"
                            strokeWidth={1.75}
                        />
                        <span>
                            Acesso restrito — apenas moderação interna, auditável.
                        </span>
                    </div>
                    <div className="flex gap-2.5">
                        <Clock
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-dim"
                            strokeWidth={1.75}
                        />
                        <span>
                            Exclusão automática — removidos 30 dias após aprovação.
                        </span>
                    </div>
                </div>
            </Card>

            {submitError && (
                <Card
                    variant="danger-subtle"
                    padding="sm"
                    className="flex items-center gap-2 text-sm text-danger"
                >
                    <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {submitError}
                </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {step > 1 && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setStep(step - 1)}
                        >
                            ← Voltar
                        </Button>
                    )}
                    {step === 1 && (
                        <Button href="/painel" variant="outline" size="lg">
                            Cancelar
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    {step < STEPS.length ? (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setStep(step + 1)}
                            disabled={!stepDone(currentStep)}
                        >
                            Próximo
                            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={!requiredDone || pending}
                            loading={pending}
                        >
                            {pending ? "Enviando…" : "Enviar para revisão"}
                            {!pending && (
                                <CheckCircle className="h-4 w-4" strokeWidth={2.4} />
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

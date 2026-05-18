"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Loader2,
  Mic,
  Pause,
  Play,
  Square,
  Upload,
  X,
} from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";
import { changeHandle } from "@/app/painel/_actions/provider-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { useToast } from "@/components/ui/toast";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { cn } from "@/lib/utils";

const LANGUAGE_OPTIONS = [
  { value: "PT", label: "Português" },
  { value: "EN", label: "Inglês" },
  { value: "ES", label: "Espanhol" },
  { value: "FR", label: "Francês" },
  { value: "IT", label: "Italiano" },
  { value: "DE", label: "Alemão" },
  { value: "JP", label: "Japonês" },
  { value: "ZH", label: "Mandarim" },
];
const HAIR_OPTIONS = ["Loiro", "Castanho", "Preto", "Ruivo", "Grisalho", "Colorido"];
const EYES_OPTIONS = ["Castanhos", "Verdes", "Azuis", "Pretos", "Mel", "Cinzas"];

type Media = {
  id: string;
  url: string;
  isPublic: boolean;
  isCover: boolean;
  sortOrder: number;
  mediaType?: string;
};
type Story = {
  id: string;
  mediaUrl: string;
  caption: string | null;
  expiresAt: Date;
  _count: { views: number; likes: number };
};
type Profile = {
  slug: string | null;
  planTier: string;
  bio: string;
  tagline: string | null;
  whatsappPhone: string | null;
  audioUrl: string | null;
  heightCm: number | null;
  dressSize: string | null;
  hair: string | null;
  eyes: string | null;
  languages: string | null;
  servesMen: boolean;
  servesWomen: boolean;
  servesCouples: boolean;
  hasOwnPlace: boolean;
  homeVisit: boolean;
  travelsNational: boolean;
  travelsInternational: boolean;
  media: Media[];
  stories: Story[];
};

/**
 * PerfilEditor — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/painel/perfil/perfil-editor.tsx
 * Steering: §3 (cor), §6 (Input/Select/Textarea/Button primitives + ToggleChip),
 * §3.4 (rose-soft em estado active de chips e pills).
 *
 * Visual:
 * - Todas as seções em `<Card variant="solid" padding="lg">` rounded-2xl + hairline.
 * - Inputs/textareas/selects via primitivos v2 (focus ring rose).
 * - Áudio: estados Idle / Recording / Pending / Saved em containers `bg-line/30`
 *   ou `bg-rose-soft` (recording). CTA principal `bg-rose`.
 * - Idiomas e atendimento em `<ToggleChip>` (rose-active state padrão Tahoe).
 * - @handle: `<Input prefix="@">` + Button.
 */
export function PerfilEditor({
  profile,
  cityName,
  citySlug,
}: {
  profile: Profile;
  cityName: string;
  citySlug: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedCitySlug, setSelectedCitySlug] = useState(citySlug);
  const [selectedCityLabel, setSelectedCityLabel] = useState(cityName);
  const [handleValue, setHandleValue] = useState(profile.slug ?? "");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handlePending, startHandleTransition] = useTransition();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(profile.audioUrl);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [pendingAudio, setPendingAudio] = useState<{
    file: File;
    localUrl: string;
  } | null>(null);
  const pendingPreviewRef = useRef<HTMLAudioElement>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "gravacao.webm", { type: "audio/webm" });
        const localUrl = URL.createObjectURL(blob);
        setPendingAudio({ file, localUrl });
        setRecording(false);
        setRecordSecs(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(
        () => setRecordSecs((s) => s + 1),
        1000,
      );
    } catch {
      toast("Permissão de microfone negada.", "error");
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stop();
  }

  const initialLangs =
    profile.languages?.split("·").map((l) => l.trim()).filter(Boolean) ?? ["PT"];
  const [selectedLangs, setSelectedLangs] = useState<string[]>(initialLangs);
  const toggleLang = (v: string) =>
    setSelectedLangs((p) =>
      p.includes(v) ? p.filter((l) => l !== v) : [...p, v],
    );

  const { upload: uploadAudioFile } = useFileUpload({
    endpoint: "/api/upload-audio",
    onError: (msg) => toast(msg, "error"),
  });

  async function uploadAudio(file: File) {
    setAudioUploading(true);
    const data = await uploadAudioFile(file);
    if (data?.url) {
      setAudioUrl(data.url as string);
      toast("Áudio salvo com sucesso.");
    }
    setAudioUploading(false);
  }

  async function removeAudio() {
    const res = await fetch("/api/upload-audio", { method: "DELETE" });
    if (res.ok) {
      setAudioUrl(null);
      setAudioPlaying(false);
      toast("Áudio removido.");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("citySlug", selectedCitySlug);
    fd.set("cityQuery", selectedCityLabel);
    fd.set("languages", selectedLangs.join(" · "));
    fd.set("_from", "painel");
    startTransition(async () => {
      const res = await saveOnboardingPerfil(fd);
      if (res?.error) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      toast("Perfil salvo com sucesso.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Card variant="danger-subtle" padding="none" className="px-4 py-3">
            <p className="text-base text-danger">{error}</p>
          </Card>
        )}

        {/* ── Localização e contato ── */}
        <Card variant="solid" padding="lg" className="space-y-5">
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Localização e contato
          </p>
          <div className="space-y-1.5">
            <span className="block text-base font-medium text-ink">
              Cidade onde atende
            </span>
            <div className="rounded-xl border border-line bg-white transition-colors duration-150 ease-[var(--ease-tahoe)] focus-within:border-rose/50 focus-within:ring-2 focus-within:ring-rose/40 focus-within:ring-offset-2 focus-within:ring-offset-background">
              <CityAutocomplete
                compact
                initialLabel={cityName}
                onSelect={(s, l) => {
                  setSelectedCitySlug(s);
                  setSelectedCityLabel(l);
                }}
              />
            </div>
          </div>
          <Input
            name="whatsappPhone"
            type="tel"
            defaultValue={profile.whatsappPhone ?? ""}
            placeholder="+55 11 99999-9999"
            label="WhatsApp"
          />
        </Card>

        {/* ── Apresentação ── */}
        <Card variant="solid" padding="lg" className="space-y-5">
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Apresentação
          </p>
          <Input
            name="tagline"
            defaultValue={profile.tagline ?? ""}
            placeholder="Ex: Encontros com calma e presença."
            label="Frase de destaque"
            maxLength={120}
          />
          <Textarea
            name="bio"
            defaultValue={profile.bio}
            rows={5}
            required
            label="Bio"
            placeholder="Fale sobre você…"
          />
        </Card>

        {/* ── Voz ── */}
        <Card variant="solid" padding="lg" className="space-y-4">
          <div>
            <p className="text-md font-semibold tracking-[-0.011em] text-ink">
              Áudio — Ouça minha voz
            </p>
            <p className="mt-0.5 text-base text-ink-dim">
              Aparece no seu perfil público. MP3, WAV ou M4A · máx 20 MB.
            </p>
          </div>

          {pendingAudio ? (
            /* ── Preview before upload ── */
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-line/30 px-4 py-3">
                <audio
                  ref={pendingPreviewRef}
                  src={pendingAudio.localUrl}
                />
                <button
                  type="button"
                  onClick={() => {
                    const a = pendingPreviewRef.current;
                    if (!a) return;
                    if (a.paused) a.play();
                    else a.pause();
                  }}
                  aria-label="Reproduzir preview"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-[var(--shadow-sm)] transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                >
                  <Play
                    className="h-3.5 w-3.5 translate-x-[1px] fill-white"
                    strokeWidth={0}
                  />
                </button>
                <p className="flex-1 text-base text-ink-dim">
                  Ouça antes de confirmar
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    URL.revokeObjectURL(pendingAudio.localUrl);
                    setPendingAudio(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                  Descartar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={audioUploading}
                  loading={audioUploading}
                  className="flex-1"
                  onClick={async () => {
                    await uploadAudio(pendingAudio.file);
                    URL.revokeObjectURL(pendingAudio.localUrl);
                    setPendingAudio(null);
                  }}
                >
                  {audioUploading ? "Enviando…" : "Confirmar"}
                </Button>
              </div>
            </div>
          ) : audioUrl ? (
            /* ── Player ── */
            <div className="flex items-center gap-3 rounded-xl bg-line/30 px-4 py-3">
              <audio
                ref={audioPreviewRef}
                src={audioUrl}
                onEnded={() => setAudioPlaying(false)}
              />
              <button
                type="button"
                onClick={() => {
                  const a = audioPreviewRef.current;
                  if (!a) return;
                  if (audioPlaying) {
                    a.pause();
                    setAudioPlaying(false);
                  } else {
                    a.play();
                    setAudioPlaying(true);
                  }
                }}
                aria-label={audioPlaying ? "Pausar" : "Reproduzir"}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose text-white shadow-[var(--shadow-sm)] transition hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
              >
                {audioPlaying ? (
                  <Pause className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
                ) : (
                  <Play
                    className="h-3.5 w-3.5 translate-x-[1px] fill-white"
                    strokeWidth={0}
                  />
                )}
              </button>
              <p className="flex-1 truncate text-base text-ink-dim">
                {audioUrl.split("/").pop()}
              </p>
              <button
                type="button"
                onClick={removeAudio}
                aria-label="Remover áudio"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-line/50 text-ink-dim transition hover:bg-line hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAudio(f);
                }}
              />

              {recording ? (
                /* ── Recording in progress ── */
                <div className="flex items-center gap-4 rounded-2xl border border-rose/20 bg-rose-soft px-5 py-4">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-50" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-rose" />
                  </span>
                  <span className="flex-1 text-md font-semibold tabular-nums text-rose">
                    {Math.floor(recordSecs / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(recordSecs % 60).toString().padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    aria-label="Parar gravação"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose text-white shadow-[var(--shadow-sm)] transition hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                  >
                    <Square
                      className="h-3.5 w-3.5 fill-white"
                      strokeWidth={0}
                    />
                  </button>
                </div>
              ) : (
                /* ── Idle state ── */
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-line/20 px-6 py-5">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={audioUploading}
                    aria-label="Iniciar gravação"
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose text-white shadow-[var(--shadow-md)] transition hover:brightness-105 active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Mic className="h-6 w-6" strokeWidth={1.75} />
                  </button>
                  <p className="text-base font-medium text-ink">
                    Gravar agora
                  </p>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={audioUploading}
                    className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-dim transition-colors hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                  >
                    {audioUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload
                        className="h-3.5 w-3.5"
                        strokeWidth={1.75}
                      />
                    )}
                    {audioUploading ? "Enviando…" : "ou enviar arquivo"}
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Características físicas ── */}
        <Card variant="solid" padding="lg" className="space-y-5">
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Características físicas
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              name="heightCm"
              type="number"
              defaultValue={profile.heightCm ?? ""}
              placeholder="168"
              label="Altura (cm)"
              min={140}
              max={220}
            />
            <Input
              name="dressSize"
              defaultValue={profile.dressSize ?? ""}
              placeholder="38"
              label="Manequim"
            />
            <Select
              name="hair"
              defaultValue={profile.hair ?? ""}
              label="Cabelo"
              placeholder="Selecione"
              options={HAIR_OPTIONS.map((h) => ({ value: h, label: h }))}
            />
            <Select
              name="eyes"
              defaultValue={profile.eyes ?? ""}
              label="Olhos"
              placeholder="Selecione"
              options={EYES_OPTIONS.map((e) => ({ value: e, label: e }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-base font-medium text-ink">
              Idiomas
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <ToggleChip
                  key={lang.value}
                  active={selectedLangs.includes(lang.value)}
                  onClick={() => toggleLang(lang.value)}
                >
                  {lang.label}
                </ToggleChip>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Atendimento ── */}
        <Card variant="solid" padding="lg" className="space-y-5">
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Atendimento
          </p>
          <div className="space-y-1.5">
            <label className="block text-base font-medium text-ink">
              Atende a
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  name: "servesMen",
                  label: "Homens",
                  checked: profile.servesMen,
                },
                {
                  name: "servesWomen",
                  label: "Mulheres",
                  checked: profile.servesWomen,
                },
                {
                  name: "servesCouples",
                  label: "Casais",
                  checked: profile.servesCouples,
                },
              ].map((o) => (
                <CheckboxChip
                  key={o.name}
                  name={o.name}
                  label={o.label}
                  defaultChecked={o.checked}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-base font-medium text-ink">
              Modalidade
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  name: "hasOwnPlace",
                  label: "Local próprio",
                  checked: profile.hasOwnPlace,
                },
                {
                  name: "homeVisit",
                  label: "A domicílio / hotel",
                  checked: profile.homeVisit,
                },
                {
                  name: "travelsNational",
                  label: "Viagens nacionais",
                  checked: profile.travelsNational,
                },
                {
                  name: "travelsInternational",
                  label: "Viagens internacionais",
                  checked: profile.travelsInternational,
                },
              ].map((o) => (
                <CheckboxChip
                  key={o.name}
                  name={o.name}
                  label={o.label}
                  defaultChecked={o.checked}
                />
              ))}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-dim">
            <span className="text-rose">*</span> obrigatório
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending}
            loading={pending}
          >
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>

      {/* ── @handle ── */}
      <Card variant="solid" padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-ink-dim" strokeWidth={1.75} />
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Seu @perfil
          </p>
        </div>
        <p className="text-xs leading-relaxed text-ink-dim">
          É o seu endereço único na plataforma. Visível na URL do seu perfil
          (privello.com.br/p/<strong className="text-ink">@perfil</strong>).
        </p>
        {handleError && (
          <p className="text-sm text-danger" role="alert">
            {handleError}
          </p>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={handleValue}
              onChange={(e) =>
                setHandleValue(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                )
              }
              placeholder="seuperfil"
              maxLength={30}
              prefix="@"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={
              handlePending || handleValue === (profile.slug ?? "")
            }
            loading={handlePending}
            onClick={() => {
              setHandleError(null);
              const fd = new FormData();
              fd.set("handle", handleValue);
              startHandleTransition(async () => {
                const res = await changeHandle(fd);
                if (res?.error) {
                  setHandleError(res.error);
                  return;
                }
                toast("@perfil atualizado.");
                router.refresh();
              });
            }}
          >
            {handlePending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
        <p className="text-2xs text-ink-faint">
          Letras minúsculas, números, _ e - · 3 a 30 caracteres · Link do perfil
          muda ao trocar
        </p>
      </Card>
    </div>
  );
}

/**
 * Helper local: chip de checkbox com active state em rose-soft.
 *
 * Usa `peer` + `peer-checked:` para reagir ao input nativo invisível, garantindo
 * que o submit do form continue funcionando sem precisar de state controlado.
 */
function CheckboxChip({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
        "border-line bg-white text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)]",
        "hover:border-rose/30 hover:text-ink",
        "has-[:checked]:border-rose has-[:checked]:bg-rose-soft has-[:checked]:text-rose",
        "focus-within:ring-2 focus-within:ring-rose/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
      )}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      {label}
    </label>
  );
}

"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AtSign, Mic, X, Play, Pause, Square, Upload } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";
import { changeHandle } from "@/app/painel/_actions/provider-settings";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFileUpload } from "@/lib/hooks/use-file-upload";

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

type Media = { id: string; url: string; isPublic: boolean; isCover: boolean; sortOrder: number; mediaType?: string };
type Story = { id: string; mediaUrl: string; caption: string | null; expiresAt: Date; _count: { views: number; likes: number } };
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

export function PerfilEditor({ profile, cityName, citySlug }: { profile: Profile; cityName: string; citySlug: string }) {
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
  const [pendingAudio, setPendingAudio] = useState<{ file: File; localUrl: string } | null>(null);
  const pendingPreviewRef = useRef<HTMLAudioElement>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
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
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      toast("Permissão de microfone negada.", "error");
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stop();
  }

  const initialLangs = profile.languages?.split(" · ").map((l) => l.trim()) ?? ["PT"];
  const [selectedLangs, setSelectedLangs] = useState<string[]>(initialLangs);
  const toggleLang = (v: string) =>
    setSelectedLangs((p) => p.includes(v) ? p.filter((l) => l !== v) : [...p, v]);

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
    if (res.ok) { setAudioUrl(null); setAudioPlaying(false); toast("Áudio removido."); }
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
      if (res?.error) { setError(res.error); toast(res.error, "error"); return; }
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
          <p className="text-md font-semibold">Localização e contato</p>
          <div className="space-y-1.5">
            <span className="block text-base font-medium text-foreground">Cidade onde atende</span>
            <div className="rounded-lg border border-black/10 overflow-hidden shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] focus-within:border-blue focus-within:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all">
              <CityAutocomplete
                compact
                initialLabel={cityName}
                onSelect={(s, l) => { setSelectedCitySlug(s); setSelectedCityLabel(l); }}
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
          <p className="text-md font-semibold">Apresentação</p>
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
            placeholder="Fale sobre você..."
          />
        </Card>

        {/* ── Voz ── */}
        <Card variant="solid" padding="lg" className="space-y-4">
          <div>
            <p className="text-md font-semibold">Áudio — Ouça minha voz</p>
            <p className="mt-0.5 text-base text-muted">Aparece no seu perfil público. MP3, WAV ou M4A · máx 20 MB.</p>
          </div>

          {pendingAudio ? (
            /* ── Preview before upload ── */
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
                <audio ref={pendingPreviewRef} src={pendingAudio.localUrl} />
                <button
                  type="button"
                  onClick={() => {
                    const a = pendingPreviewRef.current;
                    if (!a) return;
                    if (a.paused) a.play(); else a.pause();
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-white shadow-sm transition hover:brightness-110 active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-white translate-x-[1px]" strokeWidth={0} />
                </button>
                <p className="flex-1 text-base text-muted">Ouça antes de confirmar</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { URL.revokeObjectURL(pendingAudio.localUrl); setPendingAudio(null); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-base font-medium text-muted transition hover:bg-black/[0.03] hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} /> Descartar
                </button>
                <button
                  type="button"
                  disabled={audioUploading}
                  onClick={async () => {
                    await uploadAudio(pendingAudio.file);
                    URL.revokeObjectURL(pendingAudio.localUrl);
                    setPendingAudio(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-base font-medium text-white transition hover:bg-foreground/80 disabled:opacity-40"
                >
                  {audioUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {audioUploading ? "Enviando…" : "Confirmar"}
                </button>
              </div>
            </div>
          ) : audioUrl ? (
            /* ── Player ── */
            <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
              <audio ref={audioPreviewRef} src={audioUrl} onEnded={() => setAudioPlaying(false)} />
              <button
                type="button"
                onClick={() => {
                  const a = audioPreviewRef.current;
                  if (!a) return;
                  if (audioPlaying) { a.pause(); setAudioPlaying(false); }
                  else { a.play(); setAudioPlaying(true); }
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-sm transition hover:brightness-110 active:scale-95"
              >
                {audioPlaying
                  ? <Pause className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
                  : <Play className="h-3.5 w-3.5 fill-white translate-x-[1px]" strokeWidth={0} />
                }
              </button>
              <p className="flex-1 truncate text-base text-muted">{audioUrl.split("/").pop()}</p>
              <button
                type="button"
                onClick={removeAudio}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-muted transition hover:bg-black/10 hover:text-foreground"
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAudio(f); }}
              />

              {recording ? (
                /* ── Recording in progress ── */
                <div className="flex items-center gap-4 rounded-2xl bg-coral/[0.06] border border-coral/15 px-5 py-4">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-50" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
                  </span>
                  <span className="flex-1 text-md font-semibold text-coral tabular-nums">
                    {Math.floor(recordSecs / 60).toString().padStart(2, "0")}:{(recordSecs % 60).toString().padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-white shadow-sm transition hover:brightness-110 active:scale-95"
                  >
                    <Square className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
                  </button>
                </div>
              ) : (
                /* ── Idle state ── */
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] px-6 py-5">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={audioUploading}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-coral text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-40"
                  >
                    <Mic className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                  <p className="text-base font-medium text-foreground">Gravar agora</p>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={audioUploading}
                    className="flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground disabled:opacity-40"
                  >
                    {audioUploading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                    {audioUploading ? "Enviando…" : "ou enviar arquivo"}
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Características físicas ── */}
        <Card variant="solid" padding="lg" className="space-y-5">
          <p className="text-md font-semibold">Características físicas</p>
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
            <label className="block text-base font-medium text-foreground">Idiomas</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => toggleLang(lang.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${selectedLangs.includes(lang.value)
                    ? "border-foreground bg-foreground text-white"
                    : "border-line bg-white text-muted hover:border-foreground/30"
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Atendimento ── */}
        <Card variant="solid" padding="lg" className="space-y-5">
          <p className="text-md font-semibold">Atendimento</p>
          <div className="space-y-1.5">
            <label className="block text-base font-medium text-foreground">Atende a</label>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "servesMen", label: "Homens", checked: profile.servesMen },
                { name: "servesWomen", label: "Mulheres", checked: profile.servesWomen },
                { name: "servesCouples", label: "Casais", checked: profile.servesCouples },
              ].map((o) => (
                <label
                  key={o.name}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm transition hover:border-foreground/30 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-white"
                >
                  <input type="checkbox" name={o.name} defaultChecked={o.checked} className="hidden" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-base font-medium text-foreground">Modalidade</label>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "hasOwnPlace", label: "Local próprio", checked: profile.hasOwnPlace },
                { name: "homeVisit", label: "A domicílio / hotel", checked: profile.homeVisit },
                { name: "travelsNational", label: "Viagens nacionais", checked: profile.travelsNational },
                { name: "travelsInternational", label: "Viagens internacionais", checked: profile.travelsInternational },
              ].map((o) => (
                <label
                  key={o.name}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm transition hover:border-foreground/30 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-white"
                >
                  <input type="checkbox" name={o.name} defaultChecked={o.checked} className="hidden" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted"><span className="text-coral">*</span> obrigatório</p>
          <Button type="submit" variant="coral" size="lg" disabled={pending}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>

      {/* ── @handle ── */}
      <Card variant="solid" padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-muted" strokeWidth={1.5} />
          <p className="text-md font-semibold">Seu @handle</p>
        </div>
        <p className="text-xs text-muted">
          É o seu endereço único na plataforma. Visível na URL do seu perfil (privello.com/p/<strong>@handle</strong>).
        </p>
        {handleError && <p className="text-sm text-coral">{handleError}</p>}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">@</span>
            <input
              value={handleValue}
              onChange={(e) => setHandleValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="seuhandle"
              maxLength={30}
              className="w-full rounded-lg border border-black/10 bg-white py-3 pl-7 pr-4 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={handlePending || handleValue === (profile.slug ?? "")}
            onClick={() => {
              setHandleError(null);
              const fd = new FormData();
              fd.set("handle", handleValue);
              startHandleTransition(async () => {
                const res = await changeHandle(fd);
                if (res?.error) { setHandleError(res.error); return; }
                toast("@handle atualizado.");
                router.refresh();
              });
            }}
          >
            {handlePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
        <p className="text-2xs text-muted">
          Letras minúsculas, números, _ e - · 3 a 30 caracteres · Link do perfil muda ao trocar
        </p>
      </Card>
    </div>
  );
}

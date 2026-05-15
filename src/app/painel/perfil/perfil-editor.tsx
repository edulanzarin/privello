"use client";

import Image from "next/image";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AtSign, Mic, X, Play, Pause, Square, Circle } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";
import { changeHandle } from "@/app/painel/_actions/provider-settings";
import { useToast } from "@/components/ui/toast";

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
  const [uploading, setUploading] = useState(false);
  const [selectedCitySlug, setSelectedCitySlug] = useState(citySlug);
  const [selectedCityLabel, setSelectedCityLabel] = useState(cityName);
  const publicRef = useRef<HTMLInputElement>(null);
  const privateRef = useRef<HTMLInputElement>(null);
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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "gravacao.webm", { type: "audio/webm" });
        await uploadAudio(file);
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

  const publicPhotos = profile.media.filter((m) => m.isPublic);
  const privatePhotos = profile.media.filter((m) => !m.isPublic);

  async function uploadFiles(files: FileList | null, isPublic: boolean) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(isPublic));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        toast(d.error ?? "Erro ao enviar foto.", "error");
        break;
      }
    }
    setUploading(false);
    toast("Foto adicionada.");
    router.refresh();
  }

  async function uploadAudio(file: File) {
    setAudioUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/upload-audio", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { toast(data.error ?? "Erro ao enviar áudio.", "error"); }
    else { setAudioUrl(data.url); toast("Áudio salvo com sucesso."); }
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

  const inp = "w-full rounded-lg border border-black/10 bg-white px-3 py-[7px] text-[14px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none transition-all hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]";
  const sel = `${inp} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868b%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8`;
  const lbl = "block text-[13px] font-medium text-foreground mb-1.5";
  const card = "rounded-2xl border border-black/[0.06] bg-white p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-xl bg-red-50 border border-red-200/50 px-4 py-3 text-[13px] text-[#ff3b30]">{error}</div>}

        {/* ── Localização e contato ── */}
        <div className={card}>
          <p className="text-[14px] font-semibold">Localização e contato</p>
          <div>
            <span className={lbl}>Cidade onde atende</span>
            <div className="border border-line"><CityAutocomplete initialLabel={cityName} onSelect={(s, l) => { setSelectedCitySlug(s); setSelectedCityLabel(l); }} /></div>
          </div>
          <div>
            <label className={lbl}>WhatsApp</label>
            <input name="whatsappPhone" type="tel" defaultValue={profile.whatsappPhone ?? ""} placeholder="+55 11 99999-9999" className={inp} />
          </div>
        </div>

        {/* ── Apresentação ── */}
        <div className={card}>
          <p className="text-[14px] font-semibold">Apresentação</p>
          <div>
            <label className={lbl}>Frase de destaque</label>
            <input name="tagline" defaultValue={profile.tagline ?? ""} placeholder="Ex: Encontros com calma e presença." className={inp} maxLength={120} />
          </div>
          <div>
            <label className={lbl}>Bio <span className="text-coral">*</span></label>
            <textarea name="bio" defaultValue={profile.bio} rows={5} required className={`${inp} resize-none`} placeholder="Fale sobre você..." />
          </div>
        </div>

        {/* ── Voz ── */}
        <div className={card}>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <p className="text-[14px] font-semibold">Voz — "Ouça minha voz"</p>
          </div>
          <p className="text-xs text-muted">
            Um áudio curto (até 2 min) que aparece no seu perfil público. MP3, WAV ou M4A · máx 20 MB.
          </p>

          {audioUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-4 py-3">
              <audio ref={audioPreviewRef} src={audioUrl} onEnded={() => setAudioPlaying(false)} />
              <button
                type="button"
                onClick={() => {
                  const a = audioPreviewRef.current;
                  if (!a) return;
                  if (audioPlaying) { a.pause(); setAudioPlaying(false); }
                  else { a.play(); setAudioPlaying(true); }
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-white hover:bg-coral/90"
              >
                {audioPlaying
                  ? <Pause className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
                  : <Play className="h-3.5 w-3.5 fill-white translate-x-[1px]" strokeWidth={0} />
                }
              </button>
              <p className="flex-1 truncate text-xs text-muted">{audioUrl.split("/").pop()}</p>
              <button
                type="button"
                onClick={removeAudio}
                className="flex items-center gap-1 text-xs text-muted hover:text-coral"
              >
                <X className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAudio(f); }}
              />

              {recording ? (
                /* Recording in progress */
                <div className="flex items-center gap-4 rounded-xl border border-coral/30 bg-coral/5 px-5 py-3">
                  <span className="flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-coral opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-coral">
                    Gravando… {Math.floor(recordSecs / 60).toString().padStart(2, "0")}:{(recordSecs % 60).toString().padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-1.5 bg-coral px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-coral/90"
                  >
                    <Square className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
                    Parar
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={audioUploading}
                    className="flex items-center gap-2 border border-dashed border-line bg-white px-5 py-3 text-sm text-muted hover:border-coral hover:text-coral disabled:opacity-50 transition"
                  >
                    {audioUploading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Mic className="h-4 w-4" strokeWidth={1.5} />
                    }
                    {audioUploading ? "Enviando…" : "Enviar arquivo"}
                  </button>

                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={audioUploading}
                    className="flex items-center gap-2 border border-dashed border-coral/50 bg-white px-5 py-3 text-sm text-coral hover:border-coral hover:bg-coral/5 disabled:opacity-50 transition"
                  >
                    <Circle className="h-4 w-4 fill-coral text-coral" strokeWidth={0} />
                    Gravar agora
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Características ── */}
        <div className={card}>
          <p className="text-[14px] font-semibold">Características físicas</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><label className={lbl}>Altura (cm)</label><input name="heightCm" type="number" defaultValue={profile.heightCm ?? ""} placeholder="168" className={inp} min={140} max={220} /></div>
            <div><label className={lbl}>Manequim</label><input name="dressSize" defaultValue={profile.dressSize ?? ""} placeholder="38" className={inp} /></div>
            <div><label className={lbl}>Cabelo</label>
              <select name="hair" defaultValue={profile.hair ?? ""} className={sel}>
                <option value="">Selecione</option>
                {HAIR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Olhos</label>
              <select name="eyes" defaultValue={profile.eyes ?? ""} className={sel}>
                <option value="">Selecione</option>
                {EYES_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Idiomas</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button key={lang.value} type="button" onClick={() => toggleLang(lang.value)}
                  className={`border px-3 py-1.5 text-xs font-semibold transition ${selectedLangs.includes(lang.value) ? "border-foreground bg-foreground text-white" : "border-line bg-white text-muted hover:border-foreground/30"}`}>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Atendimento ── */}
        <div className={card}>
          <p className="text-[14px] font-semibold">Atendimento</p>
          <div>
            <label className={lbl}>Atende a</label>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "servesMen", label: "Homens", checked: profile.servesMen },
                { name: "servesWomen", label: "Mulheres", checked: profile.servesWomen },
                { name: "servesCouples", label: "Casais", checked: profile.servesCouples },
              ].map((o) => (
                <label key={o.name} className="flex cursor-pointer items-center gap-2 border border-line bg-white px-4 py-2.5 text-sm transition hover:border-foreground/30 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-white">
                  <input type="checkbox" name={o.name} defaultChecked={o.checked} className="hidden" />{o.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Modalidade</label>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "hasOwnPlace", label: "Local próprio", checked: profile.hasOwnPlace },
                { name: "homeVisit", label: "A domicílio / hotel", checked: profile.homeVisit },
                { name: "travelsNational", label: "Viagens nacionais", checked: profile.travelsNational },
                { name: "travelsInternational", label: "Viagens internacionais", checked: profile.travelsInternational },
              ].map((o) => (
                <label key={o.name} className="flex cursor-pointer items-center gap-2 border border-line bg-white px-4 py-2.5 text-sm transition hover:border-foreground/30 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-white">
                  <input type="checkbox" name={o.name} defaultChecked={o.checked} className="hidden" />{o.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted"><span className="text-coral">*</span> obrigatório</p>
          <button type="submit" disabled={pending}
            className="bg-coral px-8 py-3 text-[14px] font-semibold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-50">
            {pending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>

      {/* ── @handle ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-muted" strokeWidth={1.5} />
          <p className="text-[14px] font-semibold">Seu @handle</p>
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
              className="w-full border border-line bg-white py-3 pl-7 pr-4 text-sm outline-none focus:border-foreground transition"
            />
          </div>
          <button
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
            className="bg-foreground px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-foreground/80 disabled:opacity-40"
          >
            {handlePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </button>
        </div>
        <p className="text-[10px] text-muted">
          Letras minúsculas, números, _ e - · 3 a 30 caracteres · Link do perfil muda ao trocar
        </p>
      </div>
    </>
  );
}

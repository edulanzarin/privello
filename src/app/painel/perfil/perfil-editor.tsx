"use client";

import Image from "next/image";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, Lock, Trash2 } from "lucide-react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";
import { setCoverPhoto, removePhoto } from "@/app/_actions/onboarding";

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

type Media = { id: string; url: string; isPublic: boolean; isCover: boolean; sortOrder: number };
type Profile = {
  slug: string;
  bio: string;
  tagline: string | null;
  whatsappPhone: string | null;
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
};

export function PerfilEditor({ profile, cityName, citySlug }: { profile: Profile; cityName: string; citySlug: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [selectedCitySlug, setSelectedCitySlug] = useState(citySlug);
  const [selectedCityLabel, setSelectedCityLabel] = useState(cityName);
  const publicRef = useRef<HTMLInputElement>(null);
  const privateRef = useRef<HTMLInputElement>(null);

  const initialLangs = profile.languages?.split(" · ").map((l) => l.trim()) ?? ["PT"];
  const [selectedLangs, setSelectedLangs] = useState<string[]>(initialLangs);
  const toggleLang = (v: string) =>
    setSelectedLangs((p) => p.includes(v) ? p.filter((l) => l !== v) : [...p, v]);

  const publicPhotos  = profile.media.filter((m) => m.isPublic);
  const privatePhotos = profile.media.filter((m) => !m.isPublic);

  async function uploadFiles(files: FileList | null, isPublic: boolean) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(isPublic));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); setError(d.error); break; }
    }
    setUploading(false);
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    fd.set("citySlug", selectedCitySlug);
    fd.set("cityQuery", selectedCityLabel);
    fd.set("languages", selectedLangs.join(" · "));
    fd.set("_from", "painel");
    startTransition(async () => {
      const res = await saveOnboardingPerfil(fd);
      if (res?.error) { setError(res.error); return; }
      setSaved(true);
      router.refresh();
    });
  }

  const inp = "w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground transition";
  const sel = `${inp} cursor-pointer`;
  const lbl = "block text-xs font-semibold uppercase tracking-wider text-muted mb-2";
  const card = "border border-line bg-white p-6 space-y-5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && <div className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</div>}
      {saved && <div className="border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">Perfil salvo com sucesso.</div>}

      {/* ── Fotos ── */}
      <div className={card}>
        <p className="text-sm font-bold">Fotos públicas · {publicPhotos.length}</p>
        <p className="text-xs text-coral">Sem nudez explícita. Lingerie e biquíni são permitidos.</p>
        <div className="flex flex-wrap gap-3">
          {publicPhotos.map((m) => (
            <div key={m.id} className={`group relative h-28 w-28 overflow-hidden border-2 ${m.isCover ? "border-coral" : "border-line"}`}>
              <Image src={m.url} alt="" fill className="object-cover" sizes="112px" />
              {m.isCover && <span className="absolute left-0 top-0 bg-coral px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Capa</span>}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition group-hover:opacity-100">
                {!m.isCover && (
                  <button type="button" onClick={() => { setCoverPhoto(m.id); router.refresh(); }}
                    className="w-20 bg-coral py-1 text-[9px] font-bold uppercase text-white">Capa</button>
                )}
                <button type="button" onClick={() => { removePhoto(m.id); router.refresh(); }}
                  className="flex items-center gap-1 text-[9px] text-white/80 hover:text-coral">
                  <Trash2 className="h-3 w-3" /> Remover
                </button>
              </div>
            </div>
          ))}
          <input ref={publicRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => uploadFiles(e.target.files, true)} />
          <button type="button" onClick={() => publicRef.current?.click()} disabled={uploading}
            className="flex h-28 w-28 flex-col items-center justify-center gap-2 border-2 border-dashed border-line bg-white text-muted hover:border-coral hover:text-coral disabled:opacity-50">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" strokeWidth={1.25} />}
            <span className="text-[10px] font-semibold uppercase">Adicionar</span>
          </button>
        </div>

        <p className="text-sm font-bold pt-2">Galeria privada · {privatePhotos.length}</p>
        <p className="text-xs text-muted">Conteúdo explícito permitido. Visível apenas para assinantes da plataforma.</p>
        <div className="flex flex-wrap gap-3">
          {privatePhotos.map((m) => (
            <div key={m.id} className="group relative h-28 w-28 overflow-hidden border border-line">
              <Image src={m.url} alt="" fill className="object-cover" sizes="112px" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => { removePhoto(m.id); router.refresh(); }}
                  className="flex items-center gap-1 text-[9px] text-white/80 hover:text-coral">
                  <Trash2 className="h-3 w-3" /> Remover
                </button>
              </div>
            </div>
          ))}
          <input ref={privateRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => uploadFiles(e.target.files, false)} />
          <button type="button" onClick={() => privateRef.current?.click()} disabled={uploading}
            className="flex h-28 w-28 flex-col items-center justify-center gap-2 border-2 border-dashed border-line bg-white text-muted hover:border-foreground hover:text-foreground disabled:opacity-50">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" strokeWidth={1.25} />}
            <span className="text-[10px] font-semibold uppercase">Privada</span>
          </button>
        </div>
      </div>

      {/* ── Localização e contato ── */}
      <div className={card}>
        <p className="text-sm font-bold">Localização e contato</p>
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
        <p className="text-sm font-bold">Apresentação</p>
        <div>
          <label className={lbl}>Frase de destaque</label>
          <input name="tagline" defaultValue={profile.tagline ?? ""} placeholder="Ex: Encontros com calma e presença." className={inp} maxLength={120} />
        </div>
        <div>
          <label className={lbl}>Bio <span className="text-coral">*</span></label>
          <textarea name="bio" defaultValue={profile.bio} rows={5} required className={`${inp} resize-none`} placeholder="Fale sobre você..." />
        </div>
      </div>

      {/* ── Características ── */}
      <div className={card}>
        <p className="text-sm font-bold">Características físicas</p>
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
        <p className="text-sm font-bold">Atendimento</p>
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
          className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-50">
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

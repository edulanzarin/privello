"use client";

import { useState, useTransition } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";

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

type Profile = {
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
};

type Props = { profile: Profile; cityName: string; citySlug: string };

export function PerfilForm({ profile, cityName, citySlug }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedCitySlug, setSelectedCitySlug] = useState(citySlug);
  const [selectedCityLabel, setSelectedCityLabel] = useState(cityName);

  // Multi-select languages
  const initialLangs = profile.languages
    ? profile.languages.split(" · ").map((l) => l.trim())
    : ["PT"];
  const [selectedLangs, setSelectedLangs] = useState<string[]>(initialLangs);

  function toggleLang(val: string) {
    setSelectedLangs((prev) =>
      prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("citySlug", selectedCitySlug);
    fd.set("cityQuery", selectedCityLabel);
    fd.set("languages", selectedLangs.join(" · "));
    startTransition(async () => {
      const res = await saveOnboardingPerfil(fd);
      if (res?.error) setError(res.error);
    });
  }

  const inputCls = "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all";
  const selectCls = "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all cursor-pointer";
  const labelCls = "block text-base font-medium text-foreground mb-1.5";
  const sectionCls = "space-y-2";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      {error && (
        <div className="rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      {/* ── Localização e contato ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
        <p className="text-md font-semibold">Localização e contato</p>

        <div className={sectionCls}>
          <span className={labelCls}>Cidade onde atende <span className="text-coral">*</span></span>
          <div className="rounded-lg border border-black/10 overflow-hidden shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] focus-within:border-blue focus-within:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all">
            <CityAutocomplete
              compact
              initialLabel={cityName}
              onSelect={(slug, lbl) => { setSelectedCitySlug(slug); setSelectedCityLabel(lbl); }}
            />
          </div>
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>WhatsApp (com DDD) <span className="text-coral">*</span></label>
          <input
            name="whatsappPhone"
            type="tel"
            defaultValue={profile.whatsappPhone ?? ""}
            placeholder="+55 11 99999-9999"
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Apresentação ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
        <p className="text-md font-semibold">Apresentação</p>

        <div className={sectionCls}>
          <label className={labelCls}>Frase de destaque <span className="text-muted font-normal normal-case">(aparece no topo do perfil)</span></label>
          <input
            name="tagline"
            defaultValue={profile.tagline ?? ""}
            placeholder="Ex: Encontros com calma e presença de verdade."
            className={inputCls}
            maxLength={120}
          />
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Bio <span className="text-coral">*</span></label>
          <textarea
            name="bio"
            defaultValue={profile.bio}
            rows={5}
            required
            placeholder="Fale sobre você, seu estilo, o que você oferece e como prefere ser contatada..."
            className={`${inputCls} resize-none`}
          />
          <p className="text-2xs text-muted">Seja autêntica — perfis com bio completa convertem muito mais.</p>
        </div>
      </div>

      {/* ── Características físicas ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
        <p className="text-md font-semibold">Características físicas</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className={sectionCls}>
            <label className={labelCls}>Altura (cm)</label>
            <input
              name="heightCm"
              type="number"
              defaultValue={profile.heightCm ?? ""}
              placeholder="168"
              className={inputCls}
              min={140}
              max={220}
            />
          </div>
          <div className={sectionCls}>
            <label className={labelCls}>Manequim</label>
            <input
              name="dressSize"
              defaultValue={profile.dressSize ?? ""}
              placeholder="38"
              className={inputCls}
            />
          </div>
          <div className={sectionCls}>
            <label className={labelCls}>Cabelo</label>
            <select name="hair" defaultValue={profile.hair ?? ""} className={selectCls}>
              <option value="">Selecione</option>
              {HAIR_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className={sectionCls}>
            <label className={labelCls}>Olhos</label>
            <select name="eyes" defaultValue={profile.eyes ?? ""} className={selectCls}>
              <option value="">Selecione</option>
              {EYES_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Idiomas que fala</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => toggleLang(lang.value)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedLangs.includes(lang.value)
                    ? "border-foreground bg-foreground text-white"
                    : "border-line bg-white text-muted hover:border-foreground/30"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          {selectedLangs.length === 0 && (
            <p className="text-xs text-coral">Selecione ao menos um idioma.</p>
          )}
        </div>
      </div>

      {/* ── Atendimento ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] space-y-6">
        <p className="text-md font-semibold">Atendimento</p>

        <div className={sectionCls}>
          <label className={labelCls}>Atende a</label>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "servesMen",     label: "Homens",  checked: profile.servesMen },
              { name: "servesWomen",   label: "Mulheres", checked: profile.servesWomen },
              { name: "servesCouples", label: "Casais",  checked: profile.servesCouples },
            ].map((opt) => (
              <label key={opt.name} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm transition hover:border-foreground/30 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-white">
                <input type="checkbox" name={opt.name} defaultChecked={opt.checked} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className={sectionCls}>
          <label className={labelCls}>Modalidade</label>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "hasOwnPlace",          label: "Local próprio",       checked: profile.hasOwnPlace },
              { name: "homeVisit",             label: "A domicílio / hotel", checked: profile.homeVisit },
              { name: "travelsNational",       label: "Viagens nacionais",   checked: profile.travelsNational },
              { name: "travelsInternational",  label: "Viagens internacionais", checked: profile.travelsInternational },
            ].map((opt) => (
              <label key={opt.name} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm transition hover:border-foreground/30 has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-white">
                <input type="checkbox" name={opt.name} defaultChecked={opt.checked} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted"><span className="text-coral">*</span> obrigatório</p>
        <button
          type="submit"
          disabled={pending || selectedLangs.length === 0}
          className="rounded-lg bg-coral px-8 py-3 text-md font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Continuar →"}
        </button>
      </div>
    </form>
  );
}

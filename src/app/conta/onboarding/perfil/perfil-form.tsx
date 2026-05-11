"use client";

import { useState, useTransition } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("citySlug", selectedCitySlug);
    fd.set("cityQuery", selectedCityLabel);
    startTransition(async () => {
      const res = await saveOnboardingPerfil(fd);
      if (res?.error) setError(res.error);
    });
  }

  const field = "w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground";
  const label = "block text-xs font-semibold uppercase tracking-wider text-muted mb-2";
  const check = "flex items-center gap-2 text-sm cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8 max-w-2xl">
      {error && (
        <div className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      {/* Cidade */}
      <div>
        <span className={label}>Cidade onde atende</span>
        <div className="border border-line bg-white">
          <CityAutocomplete
            initialLabel={cityName}
            onSelect={(slug, lbl) => { setSelectedCitySlug(slug); setSelectedCityLabel(lbl); }}
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className={label}>WhatsApp (com DDD)</label>
        <input name="whatsappPhone" defaultValue={profile.whatsappPhone ?? ""} placeholder="+55 11 99999-9999" className={field} />
      </div>

      {/* Tagline */}
      <div>
        <label className={label}>Tagline <span className="text-muted normal-case font-normal">(frase curta de destaque)</span></label>
        <input name="tagline" defaultValue={profile.tagline ?? ""} placeholder="Ex: Encontros com calma e presença de verdade." className={field} maxLength={120} />
      </div>

      {/* Bio */}
      <div>
        <label className={label}>Bio <span className="text-coral">*</span></label>
        <textarea name="bio" defaultValue={profile.bio} rows={5} required placeholder="Fale sobre você, seu estilo, o que oferece..." className={`${field} resize-none`} />
      </div>

      {/* Atributos físicos */}
      <div>
        <p className={label}>Características físicas</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs text-muted mb-1">Altura (cm)</label>
            <input name="heightCm" type="number" defaultValue={profile.heightCm ?? ""} placeholder="168" className={field} min={140} max={220} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Manequim</label>
            <input name="dressSize" defaultValue={profile.dressSize ?? ""} placeholder="38" className={field} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Cabelo</label>
            <input name="hair" defaultValue={profile.hair ?? ""} placeholder="Castanho" className={field} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Olhos</label>
            <input name="eyes" defaultValue={profile.eyes ?? ""} placeholder="Castanhos" className={field} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-muted mb-1">Idiomas</label>
          <input name="languages" defaultValue={profile.languages ?? ""} placeholder="PT · EN · ES" className={`${field} max-w-xs`} />
        </div>
      </div>

      {/* Atende a */}
      <div>
        <p className={label}>Atende a</p>
        <div className="flex flex-wrap gap-4">
          <label className={check}><input type="checkbox" name="servesMen" defaultChecked={profile.servesMen} /> Homens</label>
          <label className={check}><input type="checkbox" name="servesWomen" defaultChecked={profile.servesWomen} /> Mulheres</label>
          <label className={check}><input type="checkbox" name="servesCouples" defaultChecked={profile.servesCouples} /> Casais</label>
        </div>
      </div>

      {/* Atendimento */}
      <div>
        <p className={label}>Modalidade de atendimento</p>
        <div className="flex flex-wrap gap-4">
          <label className={check}><input type="checkbox" name="hasOwnPlace" defaultChecked={profile.hasOwnPlace} /> Local próprio</label>
          <label className={check}><input type="checkbox" name="homeVisit" defaultChecked={profile.homeVisit} /> A domicílio / hotel</label>
          <label className={check}><input type="checkbox" name="travelsNational" defaultChecked={profile.travelsNational} /> Viagens nacionais</label>
          <label className={check}><input type="checkbox" name="travelsInternational" defaultChecked={profile.travelsInternational} /> Viagens internacionais</label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-muted">* obrigatório</span>
        <button
          type="submit"
          disabled={pending}
          className="bg-coral px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Continuar →"}
        </button>
      </div>
    </form>
  );
}

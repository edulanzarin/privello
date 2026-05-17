"use client";

import { useState, useTransition } from "react";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { saveOnboardingPerfil } from "@/app/_actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleChip } from "@/components/ui/toggle-chip";

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

const HAIR_OPTIONS = [
  { value: "Loiro", label: "Loiro" },
  { value: "Castanho", label: "Castanho" },
  { value: "Preto", label: "Preto" },
  { value: "Ruivo", label: "Ruivo" },
  { value: "Grisalho", label: "Grisalho" },
  { value: "Colorido", label: "Colorido" },
];
const EYES_OPTIONS = [
  { value: "Castanhos", label: "Castanhos" },
  { value: "Verdes", label: "Verdes" },
  { value: "Azuis", label: "Azuis" },
  { value: "Pretos", label: "Pretos" },
  { value: "Mel", label: "Mel" },
  { value: "Cinzas", label: "Cinzas" },
];

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

/**
 * PerfilForm — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/conta/onboarding/perfil/perfil-form.tsx
 * Steering: `.kiro/steering/design-system.md` §6 (forms).
 *
 * Form de identidade do perfil (cidade, contato, apresentação,
 * características físicas, atendimento). Reusa primitivos Input, Select,
 * Textarea, Card, Button, ToggleChip.
 */
export function PerfilForm({ profile, cityName, citySlug }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedCitySlug, setSelectedCitySlug] = useState(citySlug);
  const [selectedCityLabel, setSelectedCityLabel] = useState(cityName);

  const initialLangs = profile.languages
    ? profile.languages.split(" · ").map((l) => l.trim())
    : ["PT"];
  const [selectedLangs, setSelectedLangs] = useState<string[]>(initialLangs);

  // "Atende a" e "Modalidade" mantidos como state controlado para usar ToggleChip.
  const [servesMen, setServesMen] = useState(profile.servesMen);
  const [servesWomen, setServesWomen] = useState(profile.servesWomen);
  const [servesCouples, setServesCouples] = useState(profile.servesCouples);
  const [hasOwnPlace, setHasOwnPlace] = useState(profile.hasOwnPlace);
  const [homeVisit, setHomeVisit] = useState(profile.homeVisit);
  const [travelsNational, setTravelsNational] = useState(profile.travelsNational);
  const [travelsInternational, setTravelsInternational] = useState(
    profile.travelsInternational,
  );

  function toggleLang(val: string) {
    setSelectedLangs((prev) =>
      prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("citySlug", selectedCitySlug);
    fd.set("cityQuery", selectedCityLabel);
    fd.set("languages", selectedLangs.join(" · "));
    fd.set("servesMen", servesMen ? "1" : "");
    fd.set("servesWomen", servesWomen ? "1" : "");
    fd.set("servesCouples", servesCouples ? "1" : "");
    fd.set("hasOwnPlace", hasOwnPlace ? "1" : "");
    fd.set("homeVisit", homeVisit ? "1" : "");
    fd.set("travelsNational", travelsNational ? "1" : "");
    fd.set("travelsInternational", travelsInternational ? "1" : "");
    startTransition(async () => {
      const res = await saveOnboardingPerfil(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      {error && (
        <Card variant="danger-subtle" padding="sm" className="text-sm text-danger">
          {error}
        </Card>
      )}

      {/* ── Localização e contato ── */}
      <Card variant="solid" padding="lg" className="space-y-6">
        <p className="text-md font-semibold text-ink">Localização e contato</p>

        <div className="space-y-2">
          <label className="block text-base font-medium text-ink">
            Cidade onde atende{" "}
            <span className="text-rose">*</span>
          </label>
          <div className="rounded-xl border border-line bg-white shadow-[var(--shadow-hairline)] focus-within:border-rose focus-within:ring-2 focus-within:ring-rose/40 transition-all">
            <CityAutocomplete
              compact
              initialLabel={cityName}
              onSelect={(slug, lbl) => {
                setSelectedCitySlug(slug);
                setSelectedCityLabel(lbl);
              }}
            />
          </div>
        </div>

        <Input
          name="whatsappPhone"
          type="tel"
          label="WhatsApp (com DDD)"
          required
          defaultValue={profile.whatsappPhone ?? ""}
          placeholder="+55 11 99999-9999"
        />
      </Card>

      {/* ── Apresentação ── */}
      <Card variant="solid" padding="lg" className="space-y-6">
        <p className="text-md font-semibold text-ink">Apresentação</p>

        <Input
          name="tagline"
          label="Frase de destaque"
          hint="Aparece no topo do perfil — opcional"
          defaultValue={profile.tagline ?? ""}
          placeholder="Ex: Encontros com calma e presença de verdade."
          maxLength={120}
        />

        <div className="space-y-1">
          <Textarea
            name="bio"
            label="Bio"
            required
            rows={5}
            defaultValue={profile.bio}
            placeholder="Fale sobre você, seu estilo, o que você oferece e como prefere ser contatada..."
          />
          <p className="text-2xs text-ink-dim">
            Seja autêntica — perfis com bio completa convertem muito mais.
          </p>
        </div>
      </Card>

      {/* ── Características físicas ── */}
      <Card variant="solid" padding="lg" className="space-y-6">
        <p className="text-md font-semibold text-ink">Características físicas</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input
            name="heightCm"
            type="number"
            label="Altura (cm)"
            defaultValue={profile.heightCm ?? ""}
            placeholder="168"
            min={140}
            max={220}
          />
          <Input
            name="dressSize"
            label="Manequim"
            defaultValue={profile.dressSize ?? ""}
            placeholder="38"
          />
          <Select
            name="hair"
            label="Cabelo"
            defaultValue={profile.hair ?? ""}
            options={HAIR_OPTIONS}
            placeholder="Selecione"
          />
          <Select
            name="eyes"
            label="Olhos"
            defaultValue={profile.eyes ?? ""}
            options={EYES_OPTIONS}
            placeholder="Selecione"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-ink">
            Idiomas que fala
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
          {selectedLangs.length === 0 && (
            <p className="text-xs text-rose">
              Selecione ao menos um idioma.
            </p>
          )}
        </div>
      </Card>

      {/* ── Atendimento ── */}
      <Card variant="solid" padding="lg" className="space-y-6">
        <p className="text-md font-semibold text-ink">Atendimento</p>

        <div className="space-y-2">
          <label className="block text-base font-medium text-ink">
            Atende a
          </label>
          <div className="flex flex-wrap gap-2">
            <ToggleChip active={servesMen} onClick={() => setServesMen((v) => !v)}>
              Homens
            </ToggleChip>
            <ToggleChip
              active={servesWomen}
              onClick={() => setServesWomen((v) => !v)}
            >
              Mulheres
            </ToggleChip>
            <ToggleChip
              active={servesCouples}
              onClick={() => setServesCouples((v) => !v)}
            >
              Casais
            </ToggleChip>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-ink">
            Modalidade
          </label>
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={hasOwnPlace}
              onClick={() => setHasOwnPlace((v) => !v)}
            >
              Local próprio
            </ToggleChip>
            <ToggleChip
              active={homeVisit}
              onClick={() => setHomeVisit((v) => !v)}
            >
              A domicílio / hotel
            </ToggleChip>
            <ToggleChip
              active={travelsNational}
              onClick={() => setTravelsNational((v) => !v)}
            >
              Viagens nacionais
            </ToggleChip>
            <ToggleChip
              active={travelsInternational}
              onClick={() => setTravelsInternational((v) => !v)}
            >
              Viagens internacionais
            </ToggleChip>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-ink-dim">
          <span className="text-rose">*</span> obrigatório
        </p>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={pending || selectedLangs.length === 0}
          loading={pending}
        >
          {pending ? "Salvando…" : "Continuar →"}
        </Button>
      </div>
    </form>
  );
}

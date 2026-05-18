"use client";

import { useState, useTransition } from "react";
import { registerProviderAction } from "@/app/_actions/auth";
import { CityAutocomplete } from "@/components/marketing/city-autocomplete";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
const LANGUAGE_OPTIONS = [
  { value: "PT", label: "PortuguÃªs" },
  { value: "EN", label: "InglÃªs" },
  { value: "ES", label: "Espanhol" },
  { value: "FR", label: "FrancÃªs" },
  { value: "IT", label: "Italiano" },
  { value: "DE", label: "AlemÃ£o" },
];
const PAYMENT_OPTIONS = ["Pix", "Dinheiro", "CartÃ£o de crÃ©dito", "TransferÃªncia", "Cripto"];
const DURATIONS = [
  { key: "30min", label: "30 min", minutes: 30, required: false },
  { key: "1h", label: "1 hora", minutes: 60, required: true },
  { key: "2h", label: "2 horas", minutes: 120, required: false },
  { key: "3h", label: "3 horas", minutes: 180, required: false },
  { key: "4h", label: "4 horas", minutes: 240, required: false },
  { key: "overnight", label: "Pernoite", minutes: 720, required: false },
  { key: "travel", label: "DiÃ¡ria", minutes: 1440, required: false },
] as const;

type DurKey = (typeof DURATIONS)[number]["key"];

function cleanSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "");
}

const STEP_LABELS = ["Identidade", "Perfil", "Valores", "Acesso", "Foto"];

export function ProviderRegisterForm() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Step 5 â€” photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [age, setAge] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [cityLabel, setCityLabel] = useState("");

  // Step 2
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [dressSize, setDressSize] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");
  const [languages, setLanguages] = useState<string[]>(["PT"]);
  const [servesMen, setServesMen] = useState(true);
  const [servesWomen, setServesWomen] = useState(false);
  const [servesCouples, setServesCouples] = useState(false);
  const [hasOwnPlace, setHasOwnPlace] = useState(false);
  const [homeVisit, setHomeVisit] = useState(false);
  const [travelsNational, setTravelsNational] = useState(false);
  const [travelsInternational, setTravelsInternational] = useState(false);

  // Step 3
  const [durEnabled, setDurEnabled] = useState<Record<DurKey, boolean>>({
    "30min": false, "1h": true, "2h": false, "3h": false, "4h": false, "overnight": false, "travel": false,
  });
  const [durPrice, setDurPrice] = useState<Record<DurKey, string>>({
    "30min": "", "1h": "", "2h": "", "3h": "", "4h": "", "overnight": "", "travel": "",
  });
  const [payments, setPayments] = useState<string[]>([]);

  // Step 4
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function validate(s: number): string | null {
    if (s === 1) {
      if (!displayName.trim()) return "Informe seu nome artÃ­stico.";
      if (!slug.trim()) return "Escolha seu @handle.";
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return "O @ deve ter apenas letras minÃºsculas, nÃºmeros e hÃ­fens.";
      if (slug.length < 3) return "O @ deve ter ao menos 3 caracteres.";
      if (!age || parseInt(age) < 18) return "VocÃª deve ter ao menos 18 anos.";
      if (!citySlug) return "Selecione a cidade onde vocÃª atende.";
    }
    if (s === 2) {
      if (!bio.trim() || bio.trim().length < 20) return "A bio deve ter ao menos 20 caracteres.";
      if (languages.length === 0) return "Selecione ao menos um idioma.";
    }
    if (s === 3) {
      if (!durPrice["1h"] || Number(durPrice["1h"]) < 50) return "Informe o valor para 1 hora (mÃ­nimo R$ 50).";
    }
    if (s === 4) {
      if (!email.trim()) return "Informe seu e-mail.";
      if (!password || password.length < 8) return "A senha deve ter ao menos 8 caracteres.";
    }
    return null;
  }

  function handlePhotoChange(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Use uma imagem (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Imagem muito grande. MÃ¡ximo 8 MB.");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function handleFinish() {
    if (!photoFile) { setError("Selecione uma foto de perfil."); return; }
    setError(null);

    const durations = DURATIONS
      .filter((d) => durEnabled[d.key] && Number(durPrice[d.key]) > 0)
      .map((d, i) => ({
        minutes: d.minutes,
        label: d.label,
        priceBrl: Number(durPrice[d.key]),
        sortOrder: i,
      }));

    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("password", password);
    fd.set("displayName", displayName.trim());
    fd.set("slug", slug.trim());
    fd.set("age", age);
    fd.set("citySlug", citySlug);
    fd.set("cityQuery", cityLabel);
    fd.set("bio", bio.trim());
    fd.set("tagline", tagline.trim());
    fd.set("whatsapp", whatsapp.trim());
    fd.set("heightCm", heightCm);
    fd.set("dressSize", dressSize);
    fd.set("hair", hair);
    fd.set("eyes", eyes);
    fd.set("languages", languages.join(" Â· "));
    fd.set("servesMen", servesMen ? "1" : "0");
    fd.set("servesWomen", servesWomen ? "1" : "0");
    fd.set("servesCouples", servesCouples ? "1" : "0");
    fd.set("hasOwnPlace", hasOwnPlace ? "1" : "0");
    fd.set("homeVisit", homeVisit ? "1" : "0");
    fd.set("travelsNational", travelsNational ? "1" : "0");
    fd.set("travelsInternational", travelsInternational ? "1" : "0");
    fd.set("paymentMethods", payments.join(" Â· "));
    fd.set("durationsJson", JSON.stringify(durations));
    fd.set("photo", photoFile);

    startTransition(async () => {
      const res = await registerProviderAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  function next() {
    const err = validate(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => s - 1);
  }


  return (
    <div className="mt-8">
      {/* Step indicator */}
      {/* Mobile: barra de progresso compacta */}
      <div className="mb-8 sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-ink-dim">Passo {step} de {STEP_LABELS.length}</span>
          <span className="text-xs font-semibold text-rose">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="h-1 w-full rounded-full bg-line overflow-hidden">
          <div
            className="h-full rounded-full bg-rose transition-all duration-300"
            style={{ width: `${(step / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: cÃ­rculos */}
      <div className="mb-8 hidden sm:flex items-center justify-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    done ? "bg-success text-white" : active ? "bg-rose text-white scale-110" : "bg-line text-ink-dim",
                  )}
                >
                  {done ? "âœ“" : n}
                </div>
                <span className={cn("mt-1.5 text-2xs font-medium", active ? "text-ink" : "text-ink-dim")}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={cn("mx-2 mb-5 h-0.5 w-8 rounded-full transition-all", done ? "bg-success" : "bg-line")} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <Card variant="danger-subtle" padding="sm" className="mb-6 text-sm text-danger animate-fade-in">
          {error}
        </Card>
      )}

      {/* â”€â”€ Step 1: Identidade â”€â”€ */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <Card>
            <p className="text-md font-semibold mb-5">Como vocÃª Ã© conhecida</p>

            <div className="space-y-5">
              <Input
                label="Nome artÃ­stico"
                hint="Como vocÃª aparece no anÃºncio â€” pode ter iguais"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Valentina"
                required
              />

              <div>
                <Input
                  label="Seu @"
                  hint="Ãšnico e permanente â€” escolha com cuidado"
                  prefix="@"
                  value={slug}
                  onChange={(e) => setSlug(cleanSlug(e.target.value))}
                  placeholder="valentina-silva"
                />
                {slug && (
                  <p className="mt-1.5 text-xs text-ink-dim">
                    Seu perfil: <span className="font-semibold text-ink">privello.com/p/{slug}</span>
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-visible">
            <p className="text-md font-semibold mb-5">Dados bÃ¡sicos</p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Idade"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={18}
                max={99}
                placeholder="25"
                required
              />
              <div>
                <label className="block text-xs font-medium text-ink-dim-foreground mb-1.5">Cidade</label>
                <div className="rounded-lg border border-black/10 bg-white ">
                  <CityAutocomplete
                    compact
                    onSelect={(s, lbl) => { setCitySlug(s); setCityLabel(lbl); }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* â”€â”€ Step 2: Perfil â”€â”€ */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <Card>
            <p className="text-md font-semibold mb-5">Contato</p>
            <Input
              label="WhatsApp (com DDD)"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+55 11 99999-9999"
            />
          </Card>

          <Card>
            <p className="text-md font-semibold mb-5">ApresentaÃ§Ã£o</p>

            <div className="space-y-5">
              <Input
                label="Frase de destaque"
                hint="Opcional â€” aparece no topo do seu perfil"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex: Encontros com calma e presenÃ§a de verdade."
              />

              <div>
                <Textarea
                  label="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  placeholder="Fale sobre vocÃª, seu estilo, o que vocÃª oferece..."
                />
                <p className="mt-1 text-2xs text-ink-dim">{bio.length}/20 mÃ­n.</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-md font-semibold mb-5">CaracterÃ­sticas</p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input
                label="Altura (cm)"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                min={140}
                max={220}
                placeholder="168"
              />
              <Input
                label="Manequim"
                value={dressSize}
                onChange={(e) => setDressSize(e.target.value)}
                placeholder="38"
              />
              <Select
                label="Cabelo"
                value={hair}
                onChange={(e) => setHair(e.target.value)}
                options={HAIR_OPTIONS}
                placeholder="Selecione"
              />
              <Select
                label="Olhos"
                value={eyes}
                onChange={(e) => setEyes(e.target.value)}
                options={EYES_OPTIONS}
                placeholder="Selecione"
              />
            </div>

            <div className="mt-5">
              <label className="block text-xs font-medium text-ink-dim-foreground mb-2">Idiomas</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <ToggleChip
                    key={lang.value}
                    active={languages.includes(lang.value)}
                    onClick={() =>
                      setLanguages((prev) =>
                        prev.includes(lang.value) ? prev.filter((l) => l !== lang.value) : [...prev, lang.value]
                      )
                    }
                  >
                    {lang.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-md font-semibold mb-5">Atendimento</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-dim-foreground mb-2">Atende a</label>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip active={servesMen} onClick={() => setServesMen((v) => !v)}>Homens</ToggleChip>
                  <ToggleChip active={servesWomen} onClick={() => setServesWomen((v) => !v)}>Mulheres</ToggleChip>
                  <ToggleChip active={servesCouples} onClick={() => setServesCouples((v) => !v)}>Casais</ToggleChip>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-dim-foreground mb-2">Modalidade</label>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip active={hasOwnPlace} onClick={() => setHasOwnPlace((v) => !v)}>Local prÃ³prio</ToggleChip>
                  <ToggleChip active={homeVisit} onClick={() => setHomeVisit((v) => !v)}>A domicÃ­lio</ToggleChip>
                  <ToggleChip active={travelsNational} onClick={() => setTravelsNational((v) => !v)}>Viagens nacionais</ToggleChip>
                  <ToggleChip active={travelsInternational} onClick={() => setTravelsInternational((v) => !v)}>Viagens internacionais</ToggleChip>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* â”€â”€ Step 3: Valores â”€â”€ */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <Card padding="none">
            <div className="border-b border-line/50 px-6 py-4">
              <p className="text-md font-semibold">DuraÃ§Ãµes e valores</p>
              <p className="mt-1 text-xs text-ink-dim">Ative as duraÃ§Ãµes que vocÃª oferece.</p>
            </div>
            <div className="divide-y divide-line/50">
              {DURATIONS.map((d) => (
                <div key={d.key} className="flex items-center gap-4 px-6 py-4">
                  <Switch
                    checked={!!durEnabled[d.key]}
                    onChange={(c) =>
                      !d.required &&
                      setDurEnabled((p) => ({ ...p, [d.key]: c }))
                    }
                    disabled={d.required}
                    size="md"
                  />
                  <span className={cn("w-20 shrink-0 text-sm font-medium", !durEnabled[d.key] && "text-ink-dim")}>
                    {d.label}{d.required && <span className="ml-1 text-rose">*</span>}
                  </span>
                  <div className="max-w-[180px]">
                    <Input
                      type="number"
                      min={50}
                      step={50}
                      disabled={!durEnabled[d.key]}
                      value={durPrice[d.key]}
                      onChange={(e) => setDurPrice((p) => ({ ...p, [d.key]: e.target.value }))}
                      prefix="R$"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-md font-semibold mb-4">Formas de pagamento</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((p) => (
                <ToggleChip
                  key={p}
                  active={payments.includes(p)}
                  onClick={() => setPayments((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                >
                  {p}
                </ToggleChip>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* â”€â”€ Step 4: Acesso â”€â”€ */}
      {step === 4 && (
        <div className="space-y-5 animate-fade-in">
          <Card>
            <p className="text-md font-semibold mb-2">Dados de acesso</p>
            <p className="text-xs text-ink-dim mb-5">Privados â€” nÃ£o aparecem no seu anÃºncio.</p>

            <div className="space-y-4">
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="seu@email.com"
                required
              />
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="MÃ­nimo 8 caracteres"
                required
              />
            </div>
          </Card>

          <Card variant="glass">
            <p className="text-md font-semibold mb-3">Resumo</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <span className="text-ink-dim">Nome artÃ­stico</span>
              <span className="font-semibold">{displayName}</span>
              <span className="text-ink-dim">@handle</span>
              <span className="font-semibold">@{slug}</span>
              <span className="text-ink-dim">Idade</span>
              <span className="font-semibold">{age} anos</span>
              <span className="text-ink-dim">Cidade</span>
              <span className="font-semibold">{cityLabel || citySlug}</span>
              <span className="text-ink-dim">Valor/hora</span>
              <span className="font-semibold">R$ {durPrice["1h"] || "â€”"}</span>
            </div>
          </Card>
        </div>
      )}

      {/* â”€â”€ Step 5: Foto de perfil â”€â”€ */}
      {step === 5 && (
        <div className="space-y-5 animate-fade-in">
          <Card>
            <p className="text-md font-semibold mb-1">Foto de perfil</p>
            <p className="text-xs text-ink-dim mb-5">
              SerÃ¡ sua foto principal â€” vocÃª pode trocar depois no painel.
            </p>

            <div className="flex flex-col items-center gap-4">
              {/* Preview */}
              <div
                className="relative h-48 w-36 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-line bg-line/40 transition hover:border-rose/50"
                onClick={() => document.getElementById("photo-input")?.click()}
              >
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- preview de upload local (blob URL); next/image exige domain whitelist e nÃ£o funciona com objectURL
                  <img src={photoPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-dim">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs">Toque para selecionar</span>
                  </div>
                )}
              </div>

              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoChange(file);
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => document.getElementById("photo-input")?.click()}
              >
                {photoPreviewUrl ? "Trocar foto" : "Selecionar foto"}
              </Button>
            </div>
          </Card>

          <p className="text-center text-xs text-ink-dim">
            Ao finalizar vocÃª confirma ter +18 anos e concorda com os termos.
            <br />ApÃ³s o cadastro vocÃª precisarÃ¡ ativar um plano para aparecer nas buscas.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="secondary" onClick={back} disabled={pending}>
            â† Voltar
          </Button>
        ) : (
          <span />
        )}

        {step < 5 ? (
          <Button variant="primary" size="lg" onClick={next}>
            {step < 4 ? "Continuar â†’" : "PrÃ³ximo â†’"}
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={handleFinish} loading={pending}>
            {pending ? "Criando perfilâ€¦" : "Finalizar cadastro"}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Lock, Trash2, Star, Upload } from "lucide-react";
import { setCoverPhoto, removePhoto } from "@/app/_actions/onboarding";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Media = { id: string; url: string; isPublic: boolean; isCover: boolean; sortOrder: number; mediaType: string };

type Props = {
  publicMedia: Media[];
  privateMedia: Media[];
  privateCount: number;
  profileSlug: string | null;
};

const TABS = [
  { key: "galeria",  label: "Galeria pública" },
  { key: "privada",  label: "Galeria privada" },
  { key: "upload",   label: "Adicionar" },
] as const;

type Tab = typeof TABS[number]["key"];

export function MidiasManager({ publicMedia, privateMedia, privateCount, profileSlug }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("galeria");
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState("IMAGE");
  const [isPublic, setIsPublic] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(isPublic));
      fd.set("mediaType", mediaType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? "Erro ao enviar.", "error"); break; }
    }
    setUploading(false);
    toast("Arquivo adicionado com sucesso.");
    router.refresh();
    setTab(isPublic ? "galeria" : "privada");
  }

  async function handleRemove(id: string) {
    await removePhoto(id);
    toast("Removido.");
    router.refresh();
  }

  async function handleSetCover(id: string) {
    await setCoverPhoto(id);
    toast("Capa definida.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b border-line">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn(
              "px-5 py-3 text-xs font-semibold uppercase tracking-wider transition",
              tab === t.key
                ? "border-b-2 border-coral text-foreground"
                : "text-muted hover:text-foreground",
            )}>
            {t.label}
            {t.key === "galeria" && <span className="ml-1.5 text-muted">({publicMedia.length})</span>}
            {t.key === "privada" && <span className="ml-1.5 text-muted">({privateCount})</span>}
          </button>
        ))}
      </div>

      {/* ── Galeria pública — igual ao perfil público ── */}
      {tab === "galeria" && (
        <div>
          <p className="mb-3 text-xs text-coral">Sem nudez explícita. Lingerie e biquíni são permitidos.</p>
          {publicMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ImagePlus className="h-10 w-10 text-muted" strokeWidth={1} />
              <p className="text-sm text-muted">Nenhuma foto ainda. Use a aba "Adicionar".</p>
              <button onClick={() => setTab("upload")}
                className="bg-coral px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Adicionar fotos
              </button>
            </div>
          ) : (
            <>
              {/* Capa highlight */}
              {(() => {
                const cover = publicMedia.find((m) => m.isCover) ?? publicMedia[0];
                return cover ? (
                  <div className="mb-4 flex items-center gap-3 border border-coral/30 bg-coral/5 px-4 py-3">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden">
                      <Image src={cover.url} alt="" fill className="object-cover" sizes="40px" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-coral">Foto de capa atual</p>
                      <p className="text-[10px] text-muted">Esta é a foto que aparece nos cards de busca.</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Grid direto com ações no hover */}
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {publicMedia.map((m) => (
                  <div key={m.id} className={cn(
                    "group relative aspect-square overflow-hidden border-2",
                    m.isCover ? "border-coral" : "border-line",
                  )}>
                    <Image src={m.url} alt="" fill className="object-cover" sizes="128px" />
                    {m.isCover && (
                      <span className="absolute left-0 top-0 bg-coral px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                        Capa
                      </span>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 opacity-0 transition group-hover:opacity-100">
                      {!m.isCover && (
                        <button type="button" onClick={() => handleSetCover(m.id)}
                          className="flex items-center gap-1 rounded bg-coral px-2 py-0.5 text-[9px] font-bold text-white">
                          <Star className="h-2.5 w-2.5" /> Capa
                        </button>
                      )}
                      <button type="button" onClick={() => handleRemove(m.id)}
                        className="flex items-center gap-1 text-[9px] text-white/80 hover:text-coral">
                        <Trash2 className="h-2.5 w-2.5" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Galeria privada ── */}
      {tab === "privada" && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted">
            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span>Conteúdo explícito permitido. Visível apenas para assinantes da plataforma.</span>
          </div>
          {privateMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Lock className="h-10 w-10 text-muted" strokeWidth={1} />
              <p className="text-sm text-muted">Nenhuma mídia privada ainda.</p>
              <button onClick={() => { setIsPublic(false); setTab("upload"); }}
                className="bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Adicionar privada
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {privateMedia.map((m) => (
                <div key={m.id} className="group relative aspect-square overflow-hidden border border-line">
                  <Image src={m.url} alt="" fill className="object-cover" sizes="128px" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition group-hover:opacity-100">
                    <button type="button" onClick={() => handleRemove(m.id)}
                      className="flex items-center gap-1 text-[9px] text-white/80 hover:text-coral">
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload ── */}
      {tab === "upload" && (
        <div className="max-w-md space-y-5">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
                Tipo de mídia
              </label>
              <div className="flex gap-2">
                {[
                  { value: "IMAGE", label: "Foto" },
                  { value: "VIDEO", label: "Vídeo" },
                  { value: "REEL",  label: "Reel" },
                ].map((o) => (
                  <button key={o.value} type="button" onClick={() => setMediaType(o.value)}
                    className={cn(
                      "border px-4 py-2 text-xs font-semibold transition",
                      mediaType === o.value
                        ? "border-foreground bg-foreground text-white"
                        : "border-line bg-white text-muted hover:border-foreground/30",
                    )}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
                Visibilidade
              </label>
              <div className="flex gap-2">
                {[
                  { value: true,  label: "Pública" },
                  { value: false, label: "Privada" },
                ].map((o) => (
                  <button key={String(o.value)} type="button" onClick={() => setIsPublic(o.value)}
                    className={cn(
                      "border px-4 py-2 text-xs font-semibold transition",
                      isPublic === o.value
                        ? "border-foreground bg-foreground text-white"
                        : "border-line bg-white text-muted hover:border-foreground/30",
                    )}>
                    {o.label}
                  </button>
                ))}
              </div>
              {!isPublic && (
                <p className="mt-1.5 text-[10px] text-muted">Conteúdo explícito permitido na galeria privada.</p>
              )}
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept={mediaType === "IMAGE" ? "image/*" : "video/*"}
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-line bg-white py-12 text-muted transition hover:border-coral hover:text-coral disabled:opacity-50"
          >
            {uploading
              ? <Loader2 className="h-8 w-8 animate-spin" />
              : <Upload className="h-8 w-8" strokeWidth={1.25} />
            }
            <span className="text-sm font-semibold">
              {uploading ? "Enviando…" : "Clique para selecionar arquivos"}
            </span>
            <span className="text-xs text-muted/60">
              {mediaType === "IMAGE" ? "JPG, PNG, WebP · máx 8MB" : "MP4, WebM, MOV · máx 50MB"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

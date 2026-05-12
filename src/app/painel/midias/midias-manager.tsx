"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus, Loader2, Lock, Trash2, Star,
  ChevronLeft, ChevronRight, X, Play, Plus,
} from "lucide-react";
import { setCoverPhoto, removePhoto } from "@/app/_actions/onboarding";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Media = {
  id: string; url: string; isPublic: boolean;
  isCover: boolean; sortOrder: number; mediaType: string;
};

type Props = {
  publicMedia: Media[];
  privateMedia: Media[];
  privateCount: number;
  profileSlug: string | null;
};

const PAGE_SIZE = 6;
type VisTab  = "publica" | "privada";
type TypeTab = "todos" | "imagens" | "videos" | "reels";

function isVideo(m: Media) { return m.mediaType === "VIDEO" || m.mediaType === "REEL"; }
function isReel(m: Media)  { return m.mediaType === "REEL"; }
function isImage(m: Media) { return !isVideo(m); }

export function MidiasManager({ publicMedia, privateMedia, privateCount }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [visTab,   setVisTab]   = useState<VisTab>("publica");
  const [typeTab,  setTypeTab]  = useState<TypeTab>("todos");
  const [visible,  setVisible]  = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState("IMAGE");
  const [uploadPublic, setUploadPublic] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset visible on tab change
  useEffect(() => { setVisible(PAGE_SIZE); setLightbox(null); }, [visTab, typeTab]);

  const pool = visTab === "publica" ? publicMedia : privateMedia;
  const filtered = pool.filter((m) => {
    if (typeTab === "imagens") return isImage(m);
    if (typeTab === "videos")  return isVideo(m) && !isReel(m);
    if (typeTab === "reels")   return isReel(m);
    return true;
  });
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Lightbox
  const closeLb = useCallback(() => setLightbox(null), []);
  const prevLb  = useCallback(() => setLightbox((i) => (i === null || i === 0 ? filtered.length - 1 : i - 1)), [filtered.length]);
  const nextLb  = useCallback(() => setLightbox((i) => (i === null ? 0 : (i + 1) % filtered.length)), [filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") prevLb();
      if (e.key === "ArrowRight") nextLb();
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [lightbox, closeLb, prevLb, nextLb]);

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

  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const arr = Array.from(files);
    setPendingFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function uploadFiles() {
    if (!pendingFiles.length) return;
    setUploading(true);
    for (const file of pendingFiles) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(uploadPublic));
      fd.set("mediaType", mediaType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? "Erro ao enviar.", "error"); break; }
    }
    setUploading(false);
    toast(`${pendingFiles.length} arquivo(s) adicionado(s).`);
    setPendingFiles([]);
    setPreviews([]);
    setShowUpload(false);
    setVisTab(uploadPublic ? "publica" : "privada");
    router.refresh();
  }

  function cancelUpload() {
    setPendingFiles([]);
    setPreviews([]);
    setShowUpload(false);
  }

  const cover = publicMedia.find((m) => m.isCover) ?? publicMedia[0];

  const VIS_TABS: { key: VisTab; label: string; count: number }[] = [
    { key: "publica", label: "Pública",  count: publicMedia.length },
    { key: "privada", label: "Privada",  count: privateCount },
  ];

  const TYPE_TABS: { key: TypeTab; label: string }[] = [
    { key: "todos",   label: "Todos" },
    { key: "imagens", label: "Imagens" },
    { key: "videos",  label: "Vídeos" },
    { key: "reels",   label: "Reels" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Top bar: vis tabs + add button ── */}
      <div className="flex items-center justify-between border-b border-line">
        <div className="flex">
          {VIS_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setVisTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition",
                visTab === t.key
                  ? "border-b-2 border-coral text-foreground"
                  : "text-muted hover:text-foreground",
              )}>
              {t.label}
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[10px]",
                visTab === t.key ? "bg-coral/10 text-coral" : "bg-line text-muted",
              )}>{t.count}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className="mr-4 flex items-center gap-1.5 bg-coral px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-coral/90"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Adicionar
        </button>
      </div>

      {/* ── Upload panel (inline, collapsible) ── */}
      {showUpload && (
        <div className="border border-line bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Adicionar mídia</p>
            <button type="button" onClick={cancelUpload} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Type + visibility */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Tipo</label>
              <div className="flex gap-2">
                {[{ v: "IMAGE", l: "Foto" }, { v: "VIDEO", l: "Vídeo" }, { v: "REEL", l: "Reel" }].map((o) => (
                  <button key={o.v} type="button" onClick={() => setMediaType(o.v)}
                    className={cn("border px-3 py-1.5 text-xs font-semibold transition",
                      mediaType === o.v ? "border-foreground bg-foreground text-white" : "border-line bg-white text-muted hover:border-foreground/30")}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Visibilidade</label>
              <div className="flex gap-2">
                {[{ v: true, l: "Pública" }, { v: false, l: "Privada" }].map((o) => (
                  <button key={String(o.v)} type="button" onClick={() => setUploadPublic(o.v)}
                    className={cn("border px-3 py-1.5 text-xs font-semibold transition",
                      uploadPublic === o.v ? "border-foreground bg-foreground text-white" : "border-line bg-white text-muted hover:border-foreground/30")}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview grid or drop zone */}
          {previews.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {previews.map((src, i) => (
                  <div key={i} className="relative overflow-hidden bg-line" style={{ aspectRatio: "3/4" }}>
                    {pendingFiles[i]?.type.startsWith("video") ? (
                      <video src={src} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFiles((f) => f.filter((_, j) => j !== i));
                        setPreviews((p) => p.filter((_, j) => j !== i));
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-coral"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                ))}
                {/* Add more */}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center border-2 border-dashed border-line bg-white text-muted hover:border-coral hover:text-coral transition"
                  style={{ aspectRatio: "3/4" }}>
                  <Plus className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={uploadFiles} disabled={uploading}
                  className="flex flex-1 items-center justify-center gap-2 bg-coral py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : `Publicar ${pendingFiles.length} arquivo(s)`}
                </button>
                <button type="button" onClick={cancelUpload}
                  className="border border-line px-4 py-2.5 text-xs font-semibold text-muted hover:text-foreground">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-line bg-white py-10 text-muted transition hover:border-coral hover:text-coral">
              <ImagePlus className="h-8 w-8" strokeWidth={1.25} />
              <span className="text-sm font-semibold">Clique para selecionar arquivos</span>
              <span className="text-xs text-muted/60">
                {mediaType === "IMAGE" ? "JPG, PNG, WebP · máx 8MB" : "MP4, WebM, MOV · máx 50MB"}
              </span>
            </button>
          )}

          <input ref={fileRef} type="file"
            accept={mediaType === "IMAGE" ? "image/*" : "video/*"}
            multiple className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)} />

          {!uploadPublic && <p className="text-[10px] text-muted">Conteúdo explícito permitido na galeria privada.</p>}
        </div>
      )}

      {/* ── Alerts ── */}
      {visTab === "publica" && (
        <p className="text-xs text-coral">Sem nudez explícita. Lingerie e biquíni são permitidos.</p>
      )}
      {visTab === "privada" && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          Conteúdo explícito permitido. Visível apenas para assinantes da plataforma.
        </div>
      )}

      {/* ── Cover info ── */}
      {visTab === "publica" && cover && (
        <div className="flex items-center gap-3 border border-coral/20 bg-coral/5 px-4 py-2.5">
          <div className="relative h-10 w-7 shrink-0 overflow-hidden border border-coral">
            <Image src={cover.url} alt="" fill className="object-cover" sizes="28px" />
          </div>
          <p className="text-xs text-muted">
            <span className="font-semibold text-coral">Capa atual</span> — aparece nos cards de busca.
            Passe o mouse em outra foto para trocar.
          </p>
        </div>
      )}

      {/* ── Type sub-tabs ── */}
      <div className="flex gap-0 border-b border-line">
        {TYPE_TABS.map((t) => {
          const count = pool.filter((m) => {
            if (t.key === "imagens") return isImage(m);
            if (t.key === "videos")  return isVideo(m) && !isReel(m);
            if (t.key === "reels")   return isReel(m);
            return true;
          }).length;
          return (
            <button key={t.key} type="button" onClick={() => setTypeTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition",
                typeTab === t.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted hover:text-foreground",
              )}>
              {t.label} <span className="text-[10px] text-muted">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid 3 colunas, proporção 3:4 ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <ImagePlus className="h-10 w-10 text-muted" strokeWidth={1} />
          <p className="text-sm text-muted">Nenhum item aqui ainda.</p>
          <button onClick={() => setShowUpload(true)}
            className="bg-coral px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
            Adicionar
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {shown.map((m, i) => {
              const globalIdx = filtered.indexOf(m);
              return (
                <div key={m.id}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden border-2",
                    m.isCover ? "border-coral" : "border-transparent hover:border-line",
                  )}
                  style={{ aspectRatio: "3/4" }}
                  onClick={() => setLightbox(globalIdx)}
                >
                  {isVideo(m) ? (
                    <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <Image src={m.url} alt="" fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-90"
                      sizes="(max-width:640px) 33vw, 300px" />
                  )}
                  {isVideo(m) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-black/50 p-3">
                        <Play className="h-5 w-5 fill-white text-white" strokeWidth={0} />
                      </div>
                    </div>
                  )}
                  {m.isCover && (
                    <span className="absolute left-0 top-0 bg-coral px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                      Capa
                    </span>
                  )}
                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex flex-col items-end justify-start gap-1.5 bg-black/50 p-2 opacity-0 transition group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {visTab === "publica" && !m.isCover && (
                      <button type="button" onClick={() => handleSetCover(m.id)}
                        className="flex items-center gap-1 rounded bg-coral px-2 py-1 text-[9px] font-bold text-white shadow">
                        <Star className="h-2.5 w-2.5" /> Capa
                      </button>
                    )}
                    <button type="button" onClick={() => handleRemove(m.id)}
                      className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[9px] text-white hover:bg-coral shadow">
                      <Trash2 className="h-2.5 w-2.5" /> Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ver mais */}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="border border-line bg-white px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted transition hover:border-foreground hover:text-foreground"
              >
                Ver mais · {filtered.length - visible} restantes
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Lightbox ── */}
      {lightbox !== null && filtered[lightbox] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
          onClick={closeLb}>
          <div className="relative flex h-full w-full max-w-2xl flex-col items-center justify-center px-14"
            onClick={(e) => e.stopPropagation()}>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
              {lightbox + 1} / {filtered.length}
            </p>
            <button onClick={closeLb}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="flex max-h-[88vh] w-full items-center justify-center">
              {isVideo(filtered[lightbox]) ? (
                <video src={filtered[lightbox].url} controls autoPlay
                  className="max-h-[88vh] max-w-full rounded" />
              ) : (
                <Image src={filtered[lightbox].url} alt="" width={800} height={1067}
                  className="max-h-[88vh] w-auto object-contain" priority />
              )}
            </div>
            {filtered.length > 1 && (
              <>
                <button onClick={prevLb}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20">
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                </button>
                <button onClick={nextLb}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20">
                  <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

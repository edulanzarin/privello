"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus, Loader2, Lock, Trash2, Star, Upload,
  ChevronLeft, ChevronRight, X, Play,
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

type VisTab  = "publica" | "privada" | "upload";
type TypeTab = "todos" | "imagens" | "videos" | "reels";

function isVideo(m: Media) { return m.mediaType === "VIDEO" || m.mediaType === "REEL"; }
function isReel(m: Media)  { return m.mediaType === "REEL"; }
function isImage(m: Media) { return !isVideo(m); }

export function MidiasManager({ publicMedia, privateMedia, privateCount, profileSlug }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [visTab,  setVisTab]  = useState<VisTab>("publica");
  const [typeTab, setTypeTab] = useState<TypeTab>("todos");
  const [page,    setPage]    = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Upload state
  const [uploading,  setUploading]  = useState(false);
  const [mediaType,  setMediaType]  = useState("IMAGE");
  const [uploadPublic, setUploadPublic] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset page when tabs change
  useEffect(() => { setPage(0); setLightbox(null); }, [visTab, typeTab]);

  // Current pool
  const pool = visTab === "publica" ? publicMedia : privateMedia;
  const filtered = pool.filter((m) => {
    if (typeTab === "imagens") return isImage(m);
    if (typeTab === "videos")  return isVideo(m) && !isReel(m);
    if (typeTab === "reels")   return isReel(m);
    return true; // todos
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Lightbox nav
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevLb = useCallback(() => setLightbox((i) => (i === null || i === 0 ? filtered.length - 1 : i - 1)), [filtered.length]);
  const nextLb = useCallback(() => setLightbox((i) => (i === null ? 0 : (i + 1) % filtered.length)), [filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLb();
      if (e.key === "ArrowRight") nextLb();
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [lightbox, closeLightbox, prevLb, nextLb]);

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

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(uploadPublic));
      fd.set("mediaType", mediaType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? "Erro ao enviar.", "error"); break; }
    }
    setUploading(false);
    toast("Arquivo adicionado.");
    router.refresh();
    setVisTab(uploadPublic ? "publica" : "privada");
  }

  const VIS_TABS: { key: VisTab; label: string; count?: number }[] = [
    { key: "publica",  label: "Galeria pública",  count: publicMedia.length },
    { key: "privada",  label: "Galeria privada",  count: privateCount },
    { key: "upload",   label: "Adicionar" },
  ];

  const TYPE_TABS: { key: TypeTab; label: string }[] = [
    { key: "todos",    label: "Todos" },
    { key: "imagens",  label: "Imagens" },
    { key: "videos",   label: "Vídeos" },
    { key: "reels",    label: "Reels" },
  ];

  const cover = publicMedia.find((m) => m.isCover) ?? publicMedia[0];

  return (
    <div className="space-y-0">
      {/* ── Visibility tabs ── */}
      <div className="flex border-b border-line bg-white">
        {VIS_TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setVisTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition",
              visTab === t.key
                ? "border-b-2 border-coral text-foreground"
                : "text-muted hover:text-foreground",
            )}>
            {t.label}
            {t.count !== undefined && (
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[10px]",
                visTab === t.key ? "bg-coral/10 text-coral" : "bg-line text-muted",
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Upload tab ── */}
      {visTab === "upload" && (
        <div className="border border-t-0 border-line bg-white p-6 space-y-5 max-w-md">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Tipo</label>
            <div className="flex gap-2">
              {[{ v: "IMAGE", l: "Foto" }, { v: "VIDEO", l: "Vídeo" }, { v: "REEL", l: "Reel" }].map((o) => (
                <button key={o.v} type="button" onClick={() => setMediaType(o.v)}
                  className={cn("border px-4 py-2 text-xs font-semibold transition",
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
                  className={cn("border px-4 py-2 text-xs font-semibold transition",
                    uploadPublic === o.v ? "border-foreground bg-foreground text-white" : "border-line bg-white text-muted hover:border-foreground/30")}>
                  {o.l}
                </button>
              ))}
            </div>
            {!uploadPublic && <p className="mt-1.5 text-[10px] text-muted">Conteúdo explícito permitido na galeria privada.</p>}
          </div>
          <input ref={fileRef} type="file"
            accept={mediaType === "IMAGE" ? "image/*" : "video/*"}
            multiple className="hidden"
            onChange={(e) => uploadFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-line bg-white py-12 text-muted transition hover:border-coral hover:text-coral disabled:opacity-50">
            {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" strokeWidth={1.25} />}
            <span className="text-sm font-semibold">{uploading ? "Enviando…" : "Clique para selecionar"}</span>
            <span className="text-xs text-muted/60">
              {mediaType === "IMAGE" ? "JPG, PNG, WebP · máx 8MB" : "MP4, WebM, MOV · máx 50MB"}
            </span>
          </button>
        </div>
      )}

      {/* ── Gallery tabs ── */}
      {visTab !== "upload" && (
        <div className="border border-t-0 border-line bg-white">
          {/* Alerts */}
          {visTab === "publica" && (
            <p className="border-b border-line px-5 py-2.5 text-xs text-coral">
              Sem nudez explícita. Lingerie e biquíni são permitidos.
            </p>
          )}
          {visTab === "privada" && (
            <div className="flex items-center gap-2 border-b border-line px-5 py-2.5 text-xs text-muted">
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              Conteúdo explícito permitido. Visível apenas para assinantes.
            </div>
          )}

          {/* Cover info — public only */}
          {visTab === "publica" && cover && (
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <div className="relative h-10 w-8 shrink-0 overflow-hidden border border-coral">
                <Image src={cover.url} alt="" fill className="object-cover" sizes="32px" />
              </div>
              <p className="text-xs text-muted">
                <span className="font-semibold text-coral">Capa atual</span> — aparece nos cards de busca.
                Passe o mouse em outra foto para trocar.
              </p>
            </div>
          )}

          {/* Type sub-tabs */}
          <div className="flex gap-0 border-b border-line px-2">
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
                  {t.label}
                  <span className="text-[10px] text-muted">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ImagePlus className="h-10 w-10 text-muted" strokeWidth={1} />
              <p className="text-sm text-muted">Nenhum item aqui ainda.</p>
              <button onClick={() => setVisTab("upload")}
                className="bg-coral px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Adicionar
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {pageItems.map((m, i) => {
                  const globalIdx = page * PAGE_SIZE + i;
                  return (
                    <div key={m.id} className={cn(
                      "group relative aspect-square cursor-pointer overflow-hidden border-2",
                      m.isCover ? "border-coral" : "border-line",
                    )} onClick={() => setLightbox(globalIdx)}>
                      {isVideo(m) ? (
                        <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                      ) : (
                        <Image src={m.url} alt="" fill className="object-cover transition group-hover:scale-[1.04]" sizes="160px" />
                      )}
                      {isVideo(m) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-2">
                            <Play className="h-4 w-4 fill-white text-white" strokeWidth={0} />
                          </div>
                        </div>
                      )}
                      {m.isCover && (
                        <span className="absolute left-0 top-0 bg-coral px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                          Capa
                        </span>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70 opacity-0 transition group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}>
                        {visTab === "publica" && !m.isCover && (
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
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="flex items-center gap-1 text-xs font-semibold text-muted disabled:opacity-30 hover:text-foreground transition">
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Anterior
                  </button>
                  <span className="text-xs text-muted">{page + 1} / {totalPages} · {filtered.length} itens</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                    className="flex items-center gap-1 text-xs font-semibold text-muted disabled:opacity-30 hover:text-foreground transition">
                    Próxima <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox !== null && filtered[lightbox] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
          onClick={closeLightbox}>
          <div className="relative flex h-full w-full max-w-3xl flex-col items-center justify-center px-12"
            onClick={(e) => e.stopPropagation()}>
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
              {lightbox + 1} / {filtered.length}
            </p>
            <button onClick={closeLightbox}
              className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <div className="relative max-h-[85vh] w-full flex items-center justify-center">
              {isVideo(filtered[lightbox]) ? (
                <video src={filtered[lightbox].url} controls autoPlay
                  className="max-h-[85vh] max-w-full" />
              ) : (
                <Image src={filtered[lightbox].url} alt="" width={900} height={1200}
                  className="mx-auto max-h-[85vh] w-auto object-contain" priority />
              )}
            </div>
            {filtered.length > 1 && (
              <>
                <button onClick={prevLb}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:left-3">
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                </button>
                <button onClick={nextLb}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 sm:right-3">
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

"use client";

import Image from "next/image";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus, Loader2, Lock, Trash2, Star, Eye,
  ChevronLeft, ChevronRight, X, Play, Plus, ArrowLeft,
} from "lucide-react";
import { setCoverPhoto, removePhoto } from "@/app/_actions/onboarding";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type Media = {
  id: string; url: string; isPublic: boolean;
  isCover: boolean; sortOrder: number; mediaType: string;
  caption: string | null; createdAt: string;
};

type Props = {
  publicMedia: Media[];
  privateMedia: Media[];
  privateCount: number;
  profileSlug: string | null;
};

const PAGE_SIZE = 6;
type VisTab = "publica" | "privada";
type TypeTab = "todos" | "imagens" | "videos";

function isVideo(m: Media) { return m.mediaType === "VIDEO"; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

// Cover first, then createdAt DESC
function sortMedia(arr: Media[]): Media[] {
  const cover = arr.filter((m) => m.isCover);
  const rest = arr
    .filter((m) => !m.isCover)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return [...cover, ...rest];
}

export function MidiasManager({ publicMedia, privateMedia, privateCount, profileSlug }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [visTab, setVisTab] = useState<VisTab>("publica");
  const [typeTab, setTypeTab] = useState<TypeTab>("todos");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Upload panel state
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState("IMAGE");
  const [uploadPublic, setUploadPublic] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVisible(PAGE_SIZE); setLightbox(null); }, [visTab, typeTab]);

  const sortedPublic = sortMedia(publicMedia.filter((m) => m.mediaType !== "REEL"));
  const sortedPrivate = sortMedia(privateMedia.filter((m) => m.mediaType !== "REEL"));
  const pool = visTab === "publica" ? sortedPublic : sortedPrivate;

  const filtered = pool.filter((m) => {
    if (typeTab === "imagens") return !isVideo(m);
    if (typeTab === "videos") return isVideo(m);
    return true;
  });
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Lightbox
  const closeLb = useCallback(() => setLightbox(null), []);
  const prevLb = useCallback(() => setLightbox((i) => (i === null || i === 0 ? filtered.length - 1 : i - 1)), [filtered.length]);
  const nextLb = useCallback(() => setLightbox((i) => (i === null ? 0 : (i + 1) % filtered.length)), [filtered.length]);

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
    closeLb();
    toast("Removido.");
    router.refresh();
  }

  async function handleSetCover(id: string) {
    await setCoverPhoto(id);
    toast("Foto de perfil definida.");
    router.refresh();
  }

  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const arr = Array.from(files);
    setPendingFiles((prev) => [...prev, ...arr]);
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadFiles() {
    if (!pendingFiles.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of pendingFiles) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(uploadPublic));
      // Auto-detect media type from file
      const detectedType = file.type.startsWith("video") ? "VIDEO" : "IMAGE";
      fd.set("mediaType", detectedType);
      fd.set("caption", caption);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); toast(d.error ?? "Erro ao enviar.", "error"); break; }
      ok++;
    }
    setUploading(false);
    if (ok > 0) toast(`${ok} arquivo(s) adicionado(s).`);
    setPendingFiles([]);
    setPreviews([]);
    setCaption("");
    setVisTab(uploadPublic ? "publica" : "privada");
    router.refresh();
  }

  const cover = publicMedia.find((m) => m.isCover) ?? publicMedia[0];

  const VIS_TABS: { key: VisTab; label: string; count: number }[] = [
    { key: "publica", label: "Pública", count: sortedPublic.length },
    { key: "privada", label: "Privada", count: privateCount },
  ];

  const TYPE_TABS: { key: TypeTab; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "imagens", label: "Fotos" },
    { key: "videos", label: "Vídeos" },
  ];

  const curItem = lightbox !== null ? filtered[lightbox] : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

      {/* ── LEFT: tabs + grid ── */}
      <div className="space-y-4 min-w-0">

        {/* Vis tabs */}
        <div className="flex border-b border-black/[0.06]">
          {VIS_TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setVisTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold transition",
                visTab === t.key
                  ? "border-b-2 border-coral text-foreground -mb-px"
                  : "text-muted hover:text-foreground",
              )}>
              {t.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                visTab === t.key ? "bg-coral/10 text-coral" : "bg-black/[0.04] text-muted",
              )}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {visTab === "publica" && (
          <p className="text-[12px] text-coral">Sem nudez explícita. Lingerie e biquíni são permitidos.</p>
        )}
        {visTab === "privada" && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            Conteúdo explícito permitido. Visível apenas para assinantes da plataforma.
          </div>
        )}

        {/* Cover info */}
        {visTab === "publica" && cover && (
          <div className="flex items-center gap-3 rounded-xl rounded-lg ring-1 ring-coral/20 bg-coral/5 px-4 py-3">
            <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-coral">
              <Image src={cover.url} alt="" fill className="object-cover" sizes="28px" />
            </div>
            <p className="text-xs text-muted">
              <span className="font-semibold text-coral">Foto de perfil</span> — aparece nos cards de busca.
              Para trocar, abra outra foto e clique em &ldquo;Definir como perfil&rdquo;.
            </p>
          </div>
        )}

        {/* Type sub-tabs */}
        <div className="flex gap-0 border-b border-black/[0.06]">
          {TYPE_TABS.map((t) => {
            const count = pool.filter((m) => {
              if (t.key === "imagens") return !isVideo(m);
              if (t.key === "videos") return isVideo(m);
              return true;
            }).length;
            return (
              <button key={t.key} type="button" onClick={() => setTypeTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium transition",
                  typeTab === t.key
                    ? "border-b-2 border-foreground text-foreground -mb-px"
                    : "text-muted hover:text-foreground",
                )}>
                {t.label} <span className="text-[10px] text-muted">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid — always 3 columns */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ImagePlus className="h-10 w-10 text-muted" strokeWidth={1} />
            <p className="text-sm text-muted">Nenhum item aqui ainda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {shown.map((m) => {
                const globalIdx = filtered.indexOf(m);
                return (
                  <button key={m.id} type="button"
                    className={cn(
                      "group relative overflow-hidden rounded-xl",
                      m.isCover ? "ring-2 ring-coral" : "ring-1 ring-black/[0.06]",
                    )}
                    style={{ aspectRatio: "1/1" }}
                    onClick={() => setLightbox(globalIdx)}
                  >
                    {isVideo(m) ? (
                      <video src={m.url}
                        className="h-full w-full object-cover transition duration-300 group-hover:brightness-75"
                        muted playsInline />
                    ) : (
                      <Image src={m.url} alt="" fill
                        className="object-cover transition duration-300 group-hover:brightness-75"
                        sizes="33vw" />
                    )}
                    {isVideo(m) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/50 p-3">
                          <Play className="h-4 w-4 fill-white text-white" strokeWidth={0} />
                        </div>
                      </div>
                    )}
                    {m.isCover && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-coral px-2 py-[2px] text-[9px] font-semibold text-white">
                        Capa
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full border border-black/10 bg-white px-6 py-2.5 text-[13px] font-medium text-foreground shadow-sm transition hover:bg-black/[0.03] active:scale-[0.98]"
                >
                  Ver mais · {filtered.length - visible} restantes
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RIGHT: sticky upload panel ── */}
      <div className="space-y-5 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="text-[15px] font-semibold">Adicionar mídia</p>
          <p className="mt-0.5 text-[13px] text-muted">Foto ou vídeo para o seu perfil.</p>
        </div>

        {/* Preview grid or drop zone */}
        {previews.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {previews.map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl bg-black/[0.03]" style={{ aspectRatio: "1/1" }}>
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
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-coral"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center border-2 border-dashed border-black/[0.12] rounded-xl bg-white text-muted hover:border-coral hover:text-coral transition"
              style={{ aspectRatio: "1/1" }}>
              <Plus className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-black/[0.12] rounded-xl py-12 text-muted transition hover:border-coral hover:text-coral">
            <ImagePlus className="h-8 w-8" strokeWidth={1.25} />
            <span className="text-[14px] font-semibold">Selecionar arquivos</span>
            <span className="text-[11px] text-muted/60">
              JPG, PNG, WebP, MP4, WebM · máx 50MB
            </span>
          </button>
        )}

        <input ref={fileRef} type="file"
          accept="image/*,video/*"
          multiple className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)} />

        {/* Caption */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted">
            Legenda (opcional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={150}
            placeholder="Uma breve descrição…"
            className="w-full rounded-lg border border-black/10 px-3 py-[7px] text-[14px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none transition-all hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
          />
          <p className="mt-0.5 text-right text-[10px] text-muted">{caption.length}/150</p>
        </div>

        {/* Privacy — iOS toggle (same as Reels) */}
        <div className="flex items-center justify-between rounded-lg bg-black/[0.03] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {!uploadPublic ? <Lock className="h-4 w-4 text-muted" strokeWidth={1.5} /> : <Eye className="h-4 w-4 text-muted" strokeWidth={1.5} />}
            <div>
              <p className="text-[13px] font-medium">{uploadPublic ? "Público" : "Privado"}</p>
              <p className="text-[11px] text-muted">
                {uploadPublic ? "Visível para todos" : "Só assinantes veem"}
              </p>
            </div>
          </div>
          <Switch
            checked={!uploadPublic}
            onChange={(c) => setUploadPublic(!c)}
            size="md"
          />
        </div>

        {/* Publish button */}
        <button type="button" onClick={uploadFiles} disabled={!pendingFiles.length || uploading}
          className="w-full rounded-full bg-coral py-3 text-[14px] font-semibold text-white transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40">
          {uploading
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</span>
            : pendingFiles.length > 0
              ? `Publicar ${pendingFiles.length} arquivo${pendingFiles.length > 1 ? "s" : ""}`
              : "Publicar"}
        </button>

        {!uploadPublic && (
          <p className="text-[11px] text-muted">Conteúdo explícito permitido na galeria privada.</p>
        )}
      </div>

      {/* ── Full-screen lightbox ── */}
      <Modal open={!!curItem} onClose={closeLb} position="fullscreen" className="bg-black flex w-full flex-col">
        {curItem && (
          <>
            {/* Top bar */}
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <button
                onClick={closeLb}
                className="flex items-center gap-2 text-white/70 transition hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-sm">Voltar</span>
              </button>
              <p className="text-xs text-white/40">{lightbox! + 1} / {filtered.length}</p>
              <div className="w-20" />
            </div>

            {/* Media area */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              {isVideo(curItem) ? (
                <video src={curItem.url} controls autoPlay
                  className="max-h-full max-w-full" />
              ) : (
                <Image src={curItem.url} alt="" width={900} height={1200}
                  className="max-h-full max-w-full object-contain" priority />
              )}

              {/* Nav arrows */}
              {filtered.length > 1 && (
                <>
                  <button
                    onClick={prevLb}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={nextLb}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom info + actions */}
            <div className="shrink-0 border-t border-white/10 px-5 py-4">
              <div className="mx-auto max-w-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">@{profileSlug ?? "–"}</p>
                    <p className="text-xs text-white/40">{fmtDate(curItem.createdAt)}</p>
                    {curItem.caption && (
                      <p className="mt-2 text-sm leading-relaxed text-white/80">{curItem.caption}</p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2">
                    {visTab === "publica" && !curItem.isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(curItem.id)}
                        className="flex items-center gap-1.5 rounded border border-white/20 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/60 hover:text-white"
                      >
                        <Star className="h-3 w-3" strokeWidth={1.5} /> Definir perfil
                      </button>
                    )}
                    {curItem.isCover ? (
                      <p className="text-[10px] text-white/30 text-center max-w-[100px]">
                        Defina outra foto de perfil antes de remover
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemove(curItem.id)}
                        className="flex items-center gap-1.5 rounded border border-white/20 px-3 py-1.5 text-xs text-white/70 transition hover:border-coral hover:text-coral"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={1.5} /> Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Eye, EyeOff, Lock, Loader2, Play, Trash2, Upload, X } from "lucide-react";
import { createReel, deleteReel, toggleReelPrivacy } from "@/app/_actions/reels";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Reel = { id: string; url: string; caption: string | null; isPublic: boolean };

export function ReelsManager({ initialReels }: { initialReels: Reel[] }) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [caption, setCaption] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function clearPreview() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
  }

  async function handlePublish() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("mediaType", "REEL");
    fd.append("isPublic", "true");

    const url = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url ?? data.media?.url ?? null);
        } else {
          const data = JSON.parse(xhr.responseText);
          toast(data.error ?? "Erro no upload.", "error");
          resolve(null);
        }
      };
      xhr.onerror = () => { toast("Erro de conexão.", "error"); resolve(null); };
      xhr.send(fd);
    });

    setUploading(false);
    setUploadProgress(0);
    if (!url) return;

    clearPreview();

    const createFd = new FormData();
    createFd.set("url", url);
    createFd.set("caption", caption);
    createFd.set("isPrivate", String(isPrivate));
    startTransition(async () => {
      const res = await createReel(createFd);
      if (res?.error) {
        toast(res.error, "error");
      } else {
        setCaption("");
        setIsPrivate(false);
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteReel(id);
      setReels((prev) => prev.filter((r) => r.id !== id));
    });
  }

  function handleTogglePrivacy(id: string) {
    startTransition(async () => {
      const res = await toggleReelPrivacy(id);
      if ("error" in res) { toast(res.error as string, "error"); return; }
      setReels((prev) =>
        prev.map((r) => r.id === id ? { ...r, isPublic: res.isPublic } : r)
      );
      toast(res.isPublic ? "Reel agora público." : "Reel agora privado.");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

      {/* ── Reel grid ── */}
      <div>
        {reels.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 border border-dashed border-line bg-white text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-line">
              <Clapperboard className="h-7 w-7 text-muted" strokeWidth={1.25} />
            </div>
            <p className="text-sm font-semibold">Nenhum reel ainda</p>
            <p className="max-w-xs text-xs text-muted">
              Publique vídeos curtos verticais. Reels privados só aparecem para assinantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {reels.map((reel) => (
              <div key={reel.id} className="group relative aspect-[9/16] overflow-hidden border border-line bg-black">
                <video
                  src={reel.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />

                {/* Private badge */}
                {!reel.isPublic && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Privado
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <Play className="h-8 w-8 text-white" strokeWidth={1.5} />
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePrivacy(reel.id)}
                      disabled={pending}
                      title={reel.isPublic ? "Tornar privado" : "Tornar público"}
                      className="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-[9px] font-bold uppercase text-white hover:bg-white/30 disabled:opacity-50"
                    >
                      {reel.isPublic
                        ? <><EyeOff className="h-3 w-3" strokeWidth={2} /> Tornar privado</>
                        : <><Eye className="h-3 w-3" strokeWidth={2} /> Tornar público</>
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reel.id)}
                      disabled={pending}
                      className="flex items-center gap-1 rounded bg-coral px-2 py-1 text-[9px] font-bold uppercase text-white disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Remover
                    </button>
                  </div>
                </div>

                {reel.caption && (
                  <p className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-2 py-1 text-[10px] text-white">
                    {reel.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Publish panel ── */}
      <div className="border border-line bg-white p-5 space-y-4 lg:sticky lg:top-24 lg:self-start">
        <p className="font-semibold">Publicar reel</p>
        <p className="text-xs text-muted">Vídeo vertical · MP4 ou WebM · máx. 200 MB</p>

        {preview ? (
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
            <video src={preview} className="h-full w-full object-cover" muted playsInline controls />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-line py-12 text-muted hover:border-coral hover:text-coral transition"
          >
            <Upload className="h-8 w-8" strokeWidth={1.25} />
            <span className="text-sm font-semibold">Selecionar vídeo</span>
            <span className="text-xs text-muted/60">MP4, WebM · máx. 200 MB</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
            Legenda (opcional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={150}
            placeholder="Uma breve descrição…"
            className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
          <p className="mt-1 text-right text-[10px] text-muted">{caption.length}/150</p>
        </div>

        {/* Privacy toggle */}
        <button
          type="button"
          onClick={() => setIsPrivate((p) => !p)}
          className={cn(
            "flex w-full items-center gap-3 border px-3 py-3 text-sm transition",
            isPrivate
              ? "border-foreground bg-foreground text-white"
              : "border-line text-muted hover:border-foreground hover:text-foreground",
          )}
        >
          {isPrivate ? <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} /> : <Eye className="h-4 w-4 shrink-0" strokeWidth={1.5} />}
          <div className="text-left">
            <p className="text-xs font-semibold">{isPrivate ? "Privado" : "Público"}</p>
            <p className={cn("text-[10px]", isPrivate ? "text-white/60" : "text-muted")}>
              {isPrivate ? "Só assinantes veem este reel" : "Visível para todos"}
            </p>
          </div>
          <div className={cn(
            "ml-auto h-5 w-9 rounded-full transition-colors",
            isPrivate ? "bg-coral" : "bg-line",
          )}>
            <div className={cn(
              "h-5 w-5 rounded-full bg-white shadow transition-transform",
              isPrivate ? "translate-x-4" : "translate-x-0",
            )} />
          </div>
        </button>

        {uploading && (
          <div>
            <div className="h-1.5 w-full rounded bg-line">
              <div className="h-full rounded bg-coral transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted">Enviando… {uploadProgress}%</p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={!selectedFile || uploading || pending}
          className="w-full bg-coral py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-40"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </span>
          ) : pending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
            </span>
          ) : "Publicar reel"}
        </button>
      </div>
    </div>
  );
}

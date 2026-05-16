"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Eye, EyeOff, Lock, Loader2, Play, Trash2, Upload, X } from "lucide-react";
import { createReel, deleteReel, toggleReelPrivacy } from "@/app/_actions/reels";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { useFileUpload } from "@/lib/hooks/use-file-upload";

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
  const { upload } = useFileUpload({
    endpoint: "/api/upload",
    strategy: "xhr",
    onProgress: setUploadProgress,
    onError: (msg) => toast(msg, "error"),
  });

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

    const data = await upload(selectedFile, {
      mediaType: "REEL",
      isPublic: "true",
    });

    setUploading(false);
    setUploadProgress(0);
    if (!data) return;

    const url = (data.url as string | undefined) ?? (data.media as { url?: string } | undefined)?.url ?? null;
    if (!url) {
      toast("Erro ao obter URL do reel.", "error");
      return;
    }

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
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

      {/* ── Reel grid ── */}
      <div>
        {reels.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/[0.08] bg-white text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
              <Clapperboard className="h-7 w-7 text-muted" strokeWidth={1.25} />
            </div>
            <p className="text-md font-semibold">Nenhum reel ainda</p>
            <p className="max-w-xs text-base text-muted">
              Publique vídeos curtos verticais. Reels privados só aparecem para assinantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {reels.map((reel) => (
              <div key={reel.id} className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-black ring-1 ring-black/[0.06]">
                <video
                  src={reel.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />

                {!reel.isPublic && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-[3px] text-2xs font-semibold text-white backdrop-blur-sm">
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Privado
                  </div>
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100 rounded-xl">
                  <Play className="h-8 w-8 text-white" strokeWidth={1.5} />
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePrivacy(reel.id)}
                      disabled={pending}
                      className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-2xs font-medium text-white backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
                    >
                      {reel.isPublic
                        ? <><EyeOff className="h-3 w-3" strokeWidth={2} /> Privado</>
                        : <><Eye className="h-3 w-3" strokeWidth={2} /> Público</>
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reel.id)}
                      disabled={pending}
                      className="flex items-center gap-1 rounded-full bg-coral/90 px-3 py-1 text-2xs font-medium text-white disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Remover
                    </button>
                  </div>
                </div>

                {reel.caption && (
                  <p className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-xs text-white">
                    {reel.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Publish panel ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="text-lg font-semibold">Publicar reel</p>
          <p className="mt-0.5 text-base text-muted">Vídeo vertical · MP4 ou WebM · máx. 200 MB</p>
        </div>

        {preview ? (
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
            <video src={preview} className="h-full w-full object-cover" muted playsInline controls />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-black/[0.12] py-12 text-muted transition hover:border-coral hover:text-coral"
          >
            <Upload className="h-8 w-8" strokeWidth={1.25} />
            <span className="text-md font-semibold">Selecionar vídeo</span>
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
          <label className="block text-sm font-medium text-muted mb-1.5">
            Legenda (opcional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={150}
            placeholder="Uma breve descrição…"
            className="w-full rounded-lg border border-black/10 px-3 py-[7px] text-md shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none transition-all hover:border-black/20 focus:border-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)]"
          />
          <p className="mt-1 text-right text-2xs text-muted">{caption.length}/150</p>
        </div>

        {/* Privacy — iOS toggle */}
        <div className="flex items-center justify-between rounded-lg bg-black/[0.03] px-4 py-3">
          <div className="flex items-center gap-2.5">
            {isPrivate ? <Lock className="h-4 w-4 text-muted" strokeWidth={1.5} /> : <Eye className="h-4 w-4 text-muted" strokeWidth={1.5} />}
            <div>
              <p className="text-base font-medium">{isPrivate ? "Privado" : "Público"}</p>
              <p className="text-xs text-muted">
                {isPrivate ? "Só assinantes veem" : "Visível para todos"}
              </p>
            </div>
          </div>
          <Switch
            checked={isPrivate}
            onChange={setIsPrivate}
            size="md"
          />
        </div>

        {uploading && (
          <div>
            <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">Enviando… {uploadProgress}%</p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={!selectedFile || uploading || pending}
          className="w-full rounded-full bg-coral py-3 text-md font-semibold text-white transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
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

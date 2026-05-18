"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clapperboard,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Play,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createReel, deleteReel, toggleReelPrivacy } from "@/app/_actions/reels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useFileUpload } from "@/lib/hooks/use-file-upload";

type Reel = {
  id: string;
  url: string;
  caption: string | null;
  isPublic: boolean;
};

/**
 * ReelsManager — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/painel/reels-manager.tsx
 * Steering: `.kiro/steering/design-system.md` §3 (cor), §6.4 (Switch),
 * §3.4 (rose-soft surface).
 *
 * Painel de gestão de reels do provider: grid 9:16 com hover-actions
 * (toggle privacidade, deletar) + painel sticky de upload com preview /
 * legenda / switch privacy / barra de progresso rose.
 *
 * Visual:
 * - Empty state em card glass com ícone `Clapperboard` em pílula `bg-line/40`.
 * - Cada reel tile: `rounded-xl bg-ink ring-1 ring-line` (substitui
 *   `bg-black ring-black/[0.06]` da v1).
 * - Hover overlay em `bg-ink/55` com 2 chips (privacidade + remover) e ícone
 *   Play centralizado.
 * - Painel direito sticky em `rounded-2xl border-line bg-white shadow-sm`.
 * - Switch privacy em pílula `bg-line/30` com ícone contextual + helper text.
 * - Progress bar full-width rose enquanto upload acontece.
 *
 * Side effects:
 * - Hook `useFileUpload({ endpoint: "/api/upload", strategy: "xhr" })` — XHR
 *   reporta progresso de upload via `setUploadProgress`.
 * - Server actions: `createReel`, `deleteReel`, `toggleReelPrivacy`.
 * - `URL.createObjectURL` / `URL.revokeObjectURL` para preview do vídeo.
 * - `router.refresh()` após criar reel.
 */
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

    const url =
      (data.url as string | undefined) ??
      (data.media as { url?: string } | undefined)?.url ??
      null;
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
      if ("error" in res) {
        toast(res.error as string, "error");
        return;
      }
      setReels((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isPublic: res.isPublic } : r)),
      );
      toast(res.isPublic ? "Reel agora público." : "Reel agora privado.");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* ── Reel grid ── */}
      <div>
        {reels.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-white p-8 text-center shadow-[var(--shadow-hairline)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-soft">
              <Clapperboard
                className="h-7 w-7 text-rose"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-md font-semibold text-ink">
              Nenhum reel ainda
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-ink-dim">
              Publique vídeos curtos verticais. Reels privados só aparecem
              para assinantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-ink ring-1 ring-line"
              >
                <video
                  src={reel.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />

                {!reel.isPublic && (
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/65 px-2 py-[3px] text-2xs font-semibold text-white backdrop-blur-sm">
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Privado
                  </div>
                )}

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-ink/55 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <Play
                    className="h-8 w-8 text-white"
                    strokeWidth={1.5}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePrivacy(reel.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-2xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                    >
                      {reel.isPublic ? (
                        <>
                          <EyeOff className="h-3 w-3" strokeWidth={2} />
                          Privado
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" strokeWidth={2} />
                          Público
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reel.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-full bg-rose/95 px-3 py-1 text-2xs font-medium text-white shadow-[var(--shadow-sm)] transition hover:brightness-105 active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Remover
                    </button>
                  </div>
                </div>

                {reel.caption && (
                  <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/85 to-transparent px-2 pb-2 pt-6 text-xs text-white">
                    {reel.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Publish panel ── */}
      <div className="h-fit space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
        <div>
          <p className="text-lg font-semibold tracking-[-0.011em] text-ink">
            Publicar reel
          </p>
          <p className="mt-0.5 text-sm text-ink-dim">
            Vídeo vertical · MP4 ou WebM · máx. 200 MB
          </p>
        </div>

        {preview ? (
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-ink">
            <video
              src={preview}
              className="h-full w-full object-cover"
              muted
              playsInline
              controls
            />
            <button
              type="button"
              onClick={clearPreview}
              aria-label="Remover preview"
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/65 text-white backdrop-blur-sm transition hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-12 text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)] hover:border-rose/40 hover:bg-rose-soft hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Upload className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-md font-semibold">Selecionar vídeo</span>
            <span className="text-xs text-ink-faint">
              MP4, WebM · máx. 200 MB
            </span>
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
          <Input
            type="text"
            label="Legenda (opcional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={150}
            placeholder="Uma breve descrição…"
          />
          <p className="mt-1 text-right text-2xs tabular-nums text-ink-faint">
            {caption.length}/150
          </p>
        </div>

        {/* Privacy switch — pill com ícone contextual + helper */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-line/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            {isPrivate ? (
              <Lock
                className="h-4 w-4 text-ink-dim"
                strokeWidth={1.75}
              />
            ) : (
              <Eye
                className="h-4 w-4 text-ink-dim"
                strokeWidth={1.75}
              />
            )}
            <div>
              <p className="text-base font-medium text-ink">
                {isPrivate ? "Privado" : "Público"}
              </p>
              <p className="text-xs text-ink-dim">
                {isPrivate ? "Só assinantes veem" : "Visível para todos"}
              </p>
            </div>
          </div>
          <Switch checked={isPrivate} onChange={setIsPrivate} size="md" />
        </div>

        {uploading && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/50">
              <div
                className="h-full rounded-full bg-rose transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs tabular-nums text-ink-dim">
              Enviando… {uploadProgress}%
            </p>
          </div>
        )}

        <Button
          onClick={handlePublish}
          disabled={!selectedFile || uploading || pending}
          loading={uploading || pending}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            "Publicar reel"
          )}
        </Button>
      </div>
    </div>
  );
}

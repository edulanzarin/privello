"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Eye, Heart, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { createStory, deleteStory } from "@/app/_actions/stories";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useFileUpload } from "@/lib/hooks/use-file-upload";

type Story = {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  expiresAt: Date;
  createdAt: Date;
  _count: { views: number; likes: number };
};

type Props = {
  activeStories: Story[];
  expiredStories: Story[];
};

function timeLeft(exp: Date) {
  const ms = new Date(exp).getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

/**
 * StoriesManager — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/painel/stories/stories-manager.tsx
 * Steering: §15 (Stories) + §3 (cor) + §6 (primitives).
 *
 * Visual:
 * - Tile ativo: `rounded-xl border-line bg-white shadow-sm` com gradiente
 *   `from-ink/85` no rodapé pra legenda branca.
 * - Tile expirado: `rounded-xl border-line opacity-50 grayscale` em `<details>`.
 * - Painel sticky direito: `<Card>`-like rounded-2xl border-line shadow-sm.
 * - Botão de remover: pill `bg-ink/65` com hover `bg-rose`.
 * - Input legenda usa primitivo `<Input>`.
 */
export function StoriesManager({ activeStories, expiredStories }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { upload } = useFileUpload({
    endpoint: "/api/upload",
    onError: (msg) => toast(msg, "error"),
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletePending, startDelete] = useTransition();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handlePublish() {
    if (!selectedFile) return;
    setUploading(true);

    const isVideo = selectedFile.type.startsWith("video");
    const data = await upload(selectedFile, {
      isPublic: "true",
      purpose: "story",
      mediaType: isVideo ? "VIDEO" : "IMAGE",
    });
    if (!data) {
      setUploading(false);
      return;
    }
    const mediaUrl =
      (data.url as string | undefined) ??
      (data.media as { url?: string } | undefined)?.url;
    if (!mediaUrl) {
      toast("Erro ao obter URL do arquivo.", "error");
      setUploading(false);
      return;
    }

    const storyFd = new FormData();
    storyFd.set("mediaUrl", mediaUrl);
    storyFd.set("mediaType", isVideo ? "VIDEO" : "IMAGE");
    storyFd.set("caption", caption);

    await createStory(storyFd);

    setUploading(false);
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    toast("Story publicado! Dura 24h.");
    router.refresh();
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("storyId", id);
    startDelete(async () => {
      await deleteStory(fd);
      toast("Story removido.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* ── Active stories ── */}
      <div className="space-y-4">
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Ativos · {activeStories.length}
        </p>

        {activeStories.length === 0 ? (
          <EmptyState
            title="Nenhum story ativo"
            description="Publique um story no painel ao lado."
            icon={<ImagePlus className="h-10 w-10" strokeWidth={1.5} />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activeStories.map((s) => (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-sm)]"
              >
                <div className="relative aspect-[9/16]">
                  {s.mediaType === "VIDEO" ? (
                    <video
                      src={s.mediaUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      src={s.mediaUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  )}
                  {s.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-3 pb-3 pt-8">
                      <p className="line-clamp-2 text-xs text-white">
                        {s.caption}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs text-ink-dim">
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" strokeWidth={1.75} />
                      {s._count.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" strokeWidth={1.75} />
                      {s._count.likes}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 tabular-nums text-success">
                    <Clock className="h-3 w-3" strokeWidth={1.75} />
                    {timeLeft(s.expiresAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletePending}
                  aria-label="Remover story"
                  className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink/65 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-rose disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                >
                  <Trash2
                    className="h-3.5 w-3.5"
                    strokeWidth={1.75}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Expired */}
        {expiredStories.length > 0 && (
          <details className="overflow-hidden rounded-2xl border border-line bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim hover:bg-line/30">
              Expirados · {expiredStories.length}
            </summary>
            <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4">
              {expiredStories.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="relative aspect-[9/16] overflow-hidden rounded-lg border border-line opacity-50 grayscale"
                >
                  <Image
                    src={s.mediaUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* ── Publish new story ── */}
      <div className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
        <div>
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Publicar story
          </p>
          <p className="mt-0.5 text-xs text-ink-dim">
            Foto ou vídeo vertical. Dura 24h. Aparece nas bolinhas da busca.
          </p>
        </div>

        {preview ? (
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-ink">
            {selectedFile?.type.startsWith("video") ? (
              <video
                src={preview}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <Image
                src={preview}
                alt=""
                fill
                className="object-cover"
                sizes="360px"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              className="absolute right-2 top-2 inline-flex h-8 items-center justify-center rounded-full bg-ink/65 px-3 text-2xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
            >
              Trocar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-12 text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)] hover:border-rose/40 hover:bg-rose-soft hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-sm font-semibold">
              Selecionar foto ou vídeo
            </span>
            <span className="text-xs text-ink-faint">
              Vertical (9:16) recomendado
            </span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Caption */}
        <div>
          <Input
            label="Texto (opcional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Uma frase sobre o momento…"
            maxLength={150}
          />
          <p className="mt-1 text-right text-2xs tabular-nums text-ink-faint">
            {caption.length}/150
          </p>
        </div>

        <Button
          type="button"
          onClick={handlePublish}
          disabled={!selectedFile || uploading}
          loading={uploading}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publicando…
            </>
          ) : (
            "Publicar story (24h)"
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, Eye, Heart, Clock, Plus } from "lucide-react";
import { createStory, deleteStory } from "@/app/_actions/stories";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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

export function StoriesManager({ activeStories, expiredStories }: Props) {
  const router = useRouter();
  const { toast } = useToast();
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
    const fd = new FormData();
    fd.set("file", selectedFile);
    fd.set("isPublic", "true");
    fd.set("purpose", "story");
    fd.set("mediaType", isVideo ? "VIDEO" : "IMAGE");

    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    if (!uploadRes.ok) {
      const d = await uploadRes.json();
      toast(d.error ?? "Erro ao enviar.", "error");
      setUploading(false);
      return;
    }
    const data = await uploadRes.json();
    const mediaUrl = data.url ?? data.media?.url;
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
        <p className="text-xs font-medium text-muted">
          Ativos · {activeStories.length}
        </p>

        {activeStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-line py-16 text-center">
            <ImagePlus className="h-10 w-10 text-muted" strokeWidth={1} />
            <p className="text-sm text-muted">Nenhum story ativo. Publique um ao lado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activeStories.map((s) => (
              <div key={s.id} className="group relative overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="relative aspect-[9/16]">
                  {s.mediaType === "VIDEO" ? (
                    <video src={s.mediaUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <Image src={s.mediaUrl} alt="" fill className="object-cover" sizes="200px" />
                  )}
                  {s.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                      <p className="text-xs text-white line-clamp-2">{s.caption}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" strokeWidth={1.5} />
                      {s._count.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" strokeWidth={1.5} />
                      {s._count.likes}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-success">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    {timeLeft(s.expiresAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletePending}
                  className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-coral/80"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Expired */}
        {expiredStories.length > 0 && (
          <details className="rounded-xl border border-black/[0.06] overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-muted">
              Expirados · {expiredStories.length}
            </summary>
            <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4">
              {expiredStories.slice(0, 8).map((s) => (
                <div key={s.id} className="relative aspect-[9/16] overflow-hidden rounded-lg border border-black/[0.06] opacity-50 grayscale">
                  <Image src={s.mediaUrl} alt="" fill className="object-cover" sizes="100px" />
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* ── Publish new story ── */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] space-y-4 lg:sticky lg:top-24 lg:self-start">
        <p className="font-semibold">Publicar story</p>
        <p className="text-xs text-muted">Foto ou vídeo vertical. Dura 24h. Aparece nas bolinhas da busca.</p>

        {/* Preview */}
        {preview ? (
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-line">
            {selectedFile?.type.startsWith("video") ? (
              <video src={preview} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <Image src={preview} alt="" fill className="object-cover" sizes="360px" />
            )}
            <button
              type="button"
              onClick={() => { setPreview(null); setSelectedFile(null); }}
              className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/80"
            >
              Trocar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line py-12 text-muted hover:border-coral hover:text-coral transition"
          >
            <Plus className="h-8 w-8" strokeWidth={1.25} />
            <span className="text-sm font-semibold">Selecionar foto ou vídeo</span>
            <span className="text-xs text-muted/60">Vertical (9:16) recomendado</span>
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
          <label className="block text-[13px] font-medium text-foreground mb-1.5">
            Texto (opcional)
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Uma frase sobre o momento..."
            maxLength={150}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all"
          />
          <p className="mt-1 text-right text-[10px] text-muted">{caption.length}/150</p>
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={!selectedFile || uploading}
          className="w-full rounded-lg bg-coral py-3 text-[14px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Publicando…
            </span>
          ) : "Publicar story (24h)"}
        </button>
      </div>
    </div>
  );
}

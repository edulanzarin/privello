"use client";

import Image from "next/image";
import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Video, Clapperboard, BookImage, Lock, Loader2, Trash2, Star } from "lucide-react";
import { setCoverPhoto, removePhoto } from "@/app/_actions/onboarding";
import { createStory, deleteStory } from "@/app/_actions/stories";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Media = { id: string; url: string; isPublic: boolean; isCover: boolean; mediaType?: string };
type Story = { id: string; mediaUrl: string; caption: string | null; expiresAt: Date; _count: { views: number; likes: number } };

type Props = {
  publicPhotos: Media[];
  privatePhotos: Media[];
  stories: Story[];
  canPostStories: boolean;
};

const TABS = [
  { key: "fotos",    label: "Fotos",    icon: ImagePlus   },
  { key: "videos",   label: "Vídeos",   icon: Video       },
  { key: "reels",    label: "Reels",    icon: Clapperboard },
  { key: "stories",  label: "Stories",  icon: BookImage   },
] as const;

type TabKey = typeof TABS[number]["key"];

function isVideo(url: string, mediaType?: string) {
  return mediaType === "VIDEO" || /\.(mp4|webm|mov)$/i.test(url);
}

function MediaGrid({
  items,
  onRemove,
  onSetCover,
  uploading,
  onUpload,
  accept,
  isPrivate,
  label,
}: {
  items: Media[];
  onRemove: (id: string) => void;
  onSetCover?: (id: string) => void;
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  accept: string;
  isPrivate?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      {isPrivate && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span>Conteúdo explícito permitido. Visível apenas para assinantes da plataforma.</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((m) => (
          <div key={m.id} className={cn(
            "group relative aspect-square overflow-hidden rounded-xl border-2",
            m.isCover ? "border-coral" : "border-line",
          )}>
            {isVideo(m.url, m.mediaType) ? (
              <video src={m.url} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <Image src={m.url} alt="" fill className="object-cover" sizes="128px" />
            )}
            {m.isCover && (
              <span className="absolute left-0 top-0 bg-coral px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Perfil</span>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover:opacity-100">
              {onSetCover && !m.isCover && (
                <button type="button" onClick={() => onSetCover(m.id)}
                  className="flex items-center gap-1 rounded bg-coral px-2 py-1 text-[9px] font-bold uppercase text-white">
                  <Star className="h-2.5 w-2.5" /> Perfil
                </button>
              )}
              <button type="button" onClick={() => onRemove(m.id)}
                className="flex items-center gap-1 text-[9px] text-white/80 hover:text-coral">
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>
          </div>
        ))}
        <input ref={ref} type="file" accept={accept} multiple className="hidden"
          onChange={(e) => onUpload(e.target.files)} />
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-white text-muted transition disabled:opacity-50",
            isPrivate ? "border-line hover:border-foreground hover:text-foreground" : "border-line hover:border-coral hover:text-coral",
          )}>
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" strokeWidth={1.25} />}
          <span className="text-[10px] font-semibold uppercase">{label}</span>
        </button>
      </div>
    </div>
  );
}

export function MediaManager({ publicPhotos, privatePhotos, stories, canPostStories }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("fotos");
  const [uploading, setUploading] = useState(false);
  const [storyPending, startStoryTransition] = useTransition();

  // Filter by type
  const pubImages  = publicPhotos.filter((m) => !isVideo(m.url, m.mediaType));
  const pubVideos  = publicPhotos.filter((m) => isVideo(m.url, m.mediaType) && m.mediaType !== "REEL");
  const pubReels   = publicPhotos.filter((m) => m.mediaType === "REEL");

  async function uploadFiles(files: FileList | null, isPublic: boolean, mediaType = "IMAGE") {
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
    toast("Arquivo adicionado.");
    router.refresh();
  }

  async function handleRemove(id: string) {
    await removePhoto(id);
    toast("Removido.");
    router.refresh();
  }

  async function handleSetCover(id: string) {
    await setCoverPhoto(id);
    toast("Foto de perfil definida.");
    router.refresh();
  }

  const now = new Date();
  const activeStories = stories.filter((s) => new Date(s.expiresAt) > now);

  return (
    <div className="border border-line bg-white">
      {/* Tab bar */}
      <div className="flex border-b border-line overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 px-5 py-3.5 text-xs font-semibold transition",
                activeTab === t.key
                  ? "border-b-2 border-coral text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-5">
        {/* ── Fotos ── */}
        {activeTab === "fotos" && (
          <>
            <div>
              <p className="mb-1 text-xs font-medium text-muted">Fotos públicas · {pubImages.length}</p>
              <p className="mb-3 text-xs text-coral">Sem nudez explícita. Lingerie e biquíni são permitidos.</p>
              <MediaGrid
                items={pubImages}
                onRemove={handleRemove}
                onSetCover={handleSetCover}
                uploading={uploading}
                onUpload={(f) => uploadFiles(f, true, "IMAGE")}
                accept="image/*"
                label="Adicionar"
              />
            </div>
            <div className="border-t border-line pt-5">
              <p className="mb-3 text-xs font-medium text-muted">Galeria privada · {privatePhotos.length}</p>
              <MediaGrid
                items={privatePhotos}
                onRemove={handleRemove}
                uploading={uploading}
                onUpload={(f) => uploadFiles(f, false, "IMAGE")}
                accept="image/*"
                isPrivate
                label="Privada"
              />
            </div>
          </>
        )}

        {/* ── Vídeos ── */}
        {activeTab === "videos" && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted">Vídeos públicos · {pubVideos.length}</p>
            <p className="mb-3 text-xs text-muted">Vídeos curtos do seu perfil. Formatos: MP4, WebM, MOV.</p>
            <MediaGrid
              items={pubVideos}
              onRemove={handleRemove}
              uploading={uploading}
              onUpload={(f) => uploadFiles(f, true, "VIDEO")}
              accept="video/*"
              label="Adicionar"
            />
          </div>
        )}

        {/* ── Reels ── */}
        {activeTab === "reels" && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted">Reels · {pubReels.length}</p>
            <p className="mb-3 text-xs text-muted">Vídeos verticais curtos (até 60s). Aparecem na aba Reels da plataforma.</p>
            <MediaGrid
              items={pubReels}
              onRemove={handleRemove}
              uploading={uploading}
              onUpload={(f) => uploadFiles(f, true, "REEL")}
              accept="video/*"
              label="Adicionar"
            />
          </div>
        )}

        {/* ── Stories ── */}
        {activeTab === "stories" && (
          <div className="space-y-5">
            {!canPostStories ? (
              <div className="py-8 text-center">
                <p className="font-semibold">Stories disponíveis no plano Destaque ou Premium.</p>
                <a href="/painel/plano" className="mt-3 inline-block text-xs text-coral underline">Fazer upgrade</a>
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-3 text-xs font-medium text-muted">
                    Stories ativos · {activeStories.length}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {activeStories.map((s) => {
                      const exp = new Date(s.expiresAt);
                      const ms = exp.getTime() - now.getTime();
                      const h = Math.floor(ms / 3600000);
                      const m = Math.floor((ms % 3600000) / 60000);
                      return (
                        <div key={s.id} className="group relative aspect-square overflow-hidden border border-line">
                          {isVideo(s.mediaUrl) ? (
                            <video src={s.mediaUrl} className="h-full w-full object-cover" muted playsInline />
                          ) : (
                            <img src={s.mediaUrl} alt="" className="h-full w-full object-cover" />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-[9px] text-white/80">
                            {h}h {m}m
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                            <form action={deleteStory}>
                              <input type="hidden" name="storyId" value={s.id} />
                              <button type="submit" className="flex items-center gap-1 text-[9px] text-white/80 hover:text-coral">
                                <Trash2 className="h-3 w-3" /> Remover
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Post new story */}
                <div className="border-t border-line pt-5">
                  <p className="mb-3 text-xs font-medium text-muted">Publicar story</p>
                  <form action={createStory} className="space-y-3 max-w-sm">
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-1.5">URL da imagem / vídeo</label>
                      <input name="mediaUrl" required placeholder="https://..."
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-foreground mb-1.5">Legenda (opcional)</label>
                      <input name="caption" placeholder="Uma frase..." maxLength={150}
                        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] outline-none hover:border-black/20 focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] transition-all" />
                    </div>
                    <button type="submit" disabled={storyPending}
                      className="rounded-lg bg-coral px-5 py-2.5 text-[13px] font-semibold text-white hover:brightness-110 active:scale-[0.97] transition disabled:opacity-50">
                      Publicar (24h)
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

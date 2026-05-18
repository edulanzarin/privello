"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookImage,
  Clapperboard,
  ImagePlus,
  Loader2,
  Lock,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { removePhoto, setCoverPhoto } from "@/app/_actions/onboarding";
import { createStory, deleteStory } from "@/app/_actions/stories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { cn } from "@/lib/utils";

type Media = {
  id: string;
  url: string;
  isPublic: boolean;
  isCover: boolean;
  mediaType?: string;
};

type Story = {
  id: string;
  mediaUrl: string;
  caption: string | null;
  expiresAt: Date;
  _count: { views: number; likes: number };
};

type Props = {
  publicPhotos: Media[];
  privatePhotos: Media[];
  stories: Story[];
  canPostStories: boolean;
};

const TABS = [
  { key: "fotos", label: "Fotos", icon: ImagePlus },
  { key: "videos", label: "Vídeos", icon: Video },
  { key: "reels", label: "Reels", icon: Clapperboard },
  { key: "stories", label: "Stories", icon: BookImage },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isVideo(url: string, mediaType?: string) {
  return mediaType === "VIDEO" || /\.(mp4|webm|mov)$/i.test(url);
}

/**
 * Grid interno de mídia. Renderiza tiles 1:1 com:
 *  - Border `rounded-xl border-line` (rose-glow quando `isCover`).
 *  - Hover overlay com ações (definir capa, remover) em `bg-ink/60` (ink, não preto puro).
 *  - Tile final é um botão de upload com border-dashed.
 *
 * `isPrivate=true` muda a paleta do hint para `text-ink-dim` neutro e o tile de
 * upload pra hover ink (em vez de rose) — sinaliza visualmente que é canal privado.
 */
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
        <div className="flex items-center gap-2 text-xs text-ink-dim">
          <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>
            Conteúdo explícito permitido. Visível apenas para assinantes.
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((m) => (
          <div
            key={m.id}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border bg-white",
              m.isCover ? "border-rose ring-2 ring-rose/30" : "border-line",
            )}
          >
            {isVideo(m.url, m.mediaType) ? (
              <video
                src={m.url}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <Image
                src={m.url}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            )}
            {m.isCover && (
              <span className="absolute left-0 top-0 rounded-br-lg bg-rose px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white">
                Perfil
              </span>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {onSetCover && !m.isCover && (
                <button
                  type="button"
                  onClick={() => onSetCover(m.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-rose px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-white shadow-[var(--shadow-sm)] transition hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Star className="h-2.5 w-2.5" />
                  Perfil
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-2xs font-medium text-white backdrop-blur-sm hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
              >
                <Trash2 className="h-3 w-3" />
                Remover
              </button>
            </div>
          </div>
        ))}
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-white text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)] active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isPrivate
              ? "border-line hover:border-ink/30 hover:bg-line/30 hover:text-ink"
              : "border-line hover:border-rose/40 hover:bg-rose-soft hover:text-rose",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
          )}
          <span className="text-2xs font-semibold uppercase tracking-wider">
            {label}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * MediaManager — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/components/painel/media-manager.tsx
 * Steering: `.kiro/steering/design-system.md` §6 (Tabs), §3 (cor), §15 (Stories).
 *
 * Painel de gestão de mídia com tabs Fotos / Vídeos / Reels / Stories. Cada tab
 * permite upload, listagem em grid, definir foto de perfil (cover) e remover.
 *
 * Visual:
 * - Card outer `rounded-2xl border-line bg-white shadow-sm`.
 * - Tab bar sticky-feel com underline rose no active e `text-ink-dim` no inactive.
 * - Stories: usa `<Input>` v2 e `<Button>` polimórfico nos CTAs.
 *
 * Props:
 * - `publicPhotos` (Media[]): mídias públicas (fotos + vídeos + reels).
 * - `privatePhotos` (Media[]): galeria privada (apenas para assinantes).
 * - `stories` (Story[]): stories cadastradas (filtradas para mostrar somente ativas).
 * - `canPostStories` (boolean): true para Destaque/Premium; false bloqueia tab Stories.
 *
 * Side effects:
 * - Hook `useFileUpload({ endpoint: "/api/upload" })` para upload via fetch.
 * - Server actions: `setCoverPhoto`, `removePhoto`, `createStory`, `deleteStory`.
 * - `router.refresh()` após cada mutação para re-buscar dados RSC.
 */
export function MediaManager({
  publicPhotos,
  privatePhotos,
  stories,
  canPostStories,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("fotos");
  const [uploading, setUploading] = useState(false);
  const [storyPending, _startStoryTransition] = useTransition();
  const { upload } = useFileUpload({
    endpoint: "/api/upload",
    onError: (msg) => toast(msg, "error"),
  });

  const pubImages = publicPhotos.filter((m) => !isVideo(m.url, m.mediaType));
  const pubVideos = publicPhotos.filter(
    (m) => isVideo(m.url, m.mediaType) && m.mediaType !== "REEL",
  );
  const pubReels = publicPhotos.filter((m) => m.mediaType === "REEL");

  async function uploadFiles(
    files: FileList | null,
    isPublic: boolean,
    mediaType = "IMAGE",
  ) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const data = await upload(file, {
        isPublic: String(isPublic),
        mediaType,
      });
      if (!data) break;
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
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-sm)]">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-semibold tracking-[-0.005em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-b-2 border-rose text-ink"
                  : "text-ink-dim hover:text-ink",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-5 p-5">
        {/* ── Fotos ── */}
        {activeTab === "fotos" && (
          <>
            <div>
              <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                Fotos públicas · {pubImages.length}
              </p>
              <p className="mb-3 text-xs text-rose">
                Sem nudez explícita. Lingerie e biquíni são permitidos.
              </p>
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
              <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                Galeria privada · {privatePhotos.length}
              </p>
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
            <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
              Vídeos públicos · {pubVideos.length}
            </p>
            <p className="mb-3 text-xs text-ink-dim">
              Vídeos curtos do seu perfil. Formatos: MP4, WebM, MOV.
            </p>
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
            <p className="mb-1 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
              Reels · {pubReels.length}
            </p>
            <p className="mb-3 text-xs text-ink-dim">
              Vídeos verticais curtos (até 60s). Aparecem na aba Reels.
            </p>
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
              <div className="rounded-2xl border border-line bg-rose-soft/50 px-6 py-10 text-center">
                <p className="text-md font-semibold text-ink">
                  Stories disponíveis no plano Destaque ou Premium.
                </p>
                <Button
                  href="/painel/plano"
                  variant="primary"
                  size="md"
                  className="mt-4"
                >
                  Fazer upgrade
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Stories ativos · {activeStories.length}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {activeStories.map((s) => {
                      const exp = new Date(s.expiresAt);
                      const ms = exp.getTime() - now.getTime();
                      const h = Math.floor(ms / 3600000);
                      const m = Math.floor((ms % 3600000) / 60000);
                      return (
                        <div
                          key={s.id}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-white"
                        >
                          {isVideo(s.mediaUrl) ? (
                            <video
                              src={s.mediaUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element -- thumbnail de story em painel; next/image exigiria domain whitelist por usuário
                            <img
                              src={s.mediaUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-ink/65 px-2 py-1 text-2xs font-medium tabular-nums text-white">
                            {h}h {m}m
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-ink/65 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <form action={deleteStory}>
                              <input
                                type="hidden"
                                name="storyId"
                                value={s.id}
                              />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-2xs font-medium text-white backdrop-blur-sm hover:bg-white/25"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remover
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
                  <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-dim">
                    Publicar story
                  </p>
                  <form
                    action={createStory}
                    className="max-w-sm space-y-3"
                  >
                    <Input
                      name="mediaUrl"
                      label="URL da imagem / vídeo"
                      placeholder="https://..."
                      required
                    />
                    <Input
                      name="caption"
                      label="Legenda (opcional)"
                      placeholder="Uma frase…"
                      maxLength={150}
                    />
                    <Button
                      type="submit"
                      disabled={storyPending}
                      loading={storyPending}
                      variant="primary"
                      size="md"
                    >
                      Publicar (24h)
                    </Button>
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

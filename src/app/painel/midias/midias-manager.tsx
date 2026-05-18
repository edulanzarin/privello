"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImagePlus,
  Loader2,
  Lock,
  Play,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { removePhoto, setCoverPhoto } from "@/app/_actions/onboarding";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { cn } from "@/lib/utils";

type Media = {
  id: string;
  url: string;
  isPublic: boolean;
  isCover: boolean;
  sortOrder: number;
  mediaType: string;
  caption: string | null;
  createdAt: string;
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

function isVideo(m: Media) {
  return m.mediaType === "VIDEO";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortMedia(arr: Media[]): Media[] {
  const cover = arr.filter((m) => m.isCover);
  const rest = arr
    .filter((m) => !m.isCover)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return [...cover, ...rest];
}

/**
 * MidiasManager — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/painel/midias/midias-manager.tsx
 * Steering: §3 (cor), §6 (Switch + Input + Button primitives), §15 (lightbox modal).
 *
 * Visual:
 * - Tab bar com underline rose no active.
 * - Cover info pill em rose-soft.
 * - Sub-tabs (Tipo) com underline ink no active.
 * - Grid 3-col com tiles `rounded-xl ring-line` (cover ring rose-2px).
 * - Painel sticky direito v2 com upload zone dashed rose-soft.
 * - Lightbox: bg-black, top bar com Voltar + counter, action buttons hairline.
 */
export function MidiasManager({
  publicMedia,
  privateMedia,
  privateCount,
  profileSlug,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { upload } = useFileUpload({
    endpoint: "/api/upload",
    onError: (msg) => toast(msg, "error"),
  });

  const [visTab, setVisTab] = useState<VisTab>("publica");
  const [typeTab, setTypeTab] = useState<TypeTab>("todos");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadPublic, setUploadPublic] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- prop-driven reset
  useEffect(() => {
    setVisible(PAGE_SIZE);
    setLightbox(null);
  }, [visTab, typeTab]);

  const sortedPublic = sortMedia(
    publicMedia.filter((m) => m.mediaType !== "REEL"),
  );
  const sortedPrivate = sortMedia(
    privateMedia.filter((m) => m.mediaType !== "REEL"),
  );
  const pool = visTab === "publica" ? sortedPublic : sortedPrivate;

  const filtered = pool.filter((m) => {
    if (typeTab === "imagens") return !isVideo(m);
    if (typeTab === "videos") return isVideo(m);
    return true;
  });
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const closeLb = useCallback(() => setLightbox(null), []);
  const prevLb = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () =>
      setLightbox((i) =>
        i === null || i === 0 ? filtered.length - 1 : i - 1,
      ),
    [filtered.length],
  );
  const nextLb = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () =>
      setLightbox((i) =>
        i === null ? 0 : (i + 1) % filtered.length,
      ),
    [filtered.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") prevLb();
      if (e.key === "ArrowRight") nextLb();
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
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
      const detectedType = file.type.startsWith("video") ? "VIDEO" : "IMAGE";
      const data = await upload(file, {
        isPublic: String(uploadPublic),
        mediaType: detectedType,
        caption,
      });
      if (!data) break;
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
      <div className="min-w-0 space-y-4">
        {/* Vis tabs */}
        <div className="flex border-b border-line">
          {VIS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setVisTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold tracking-[-0.005em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                visTab === t.key
                  ? "-mb-px border-b-2 border-rose text-ink"
                  : "text-ink-dim hover:text-ink",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-2xs tabular-nums",
                  visTab === t.key
                    ? "bg-rose-soft text-rose"
                    : "bg-line/40 text-ink-dim",
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {visTab === "publica" && (
          <p className="text-sm text-rose">
            Sem nudez explícita. Lingerie e biquíni são permitidos.
          </p>
        )}
        {visTab === "privada" && (
          <div className="flex items-center gap-2 text-xs text-ink-dim">
            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            Conteúdo explícito permitido. Visível apenas para assinantes.
          </div>
        )}

        {/* Cover info */}
        {visTab === "publica" && cover && (
          <div className="flex items-center gap-3 rounded-xl border border-rose/20 bg-rose-soft px-4 py-3">
            <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-rose">
              <Image
                src={cover.url}
                alt=""
                fill
                className="object-cover"
                sizes="28px"
              />
            </div>
            <p className="text-xs leading-relaxed text-ink-dim">
              <span className="font-semibold text-rose">Foto de perfil</span>{" "}
              — aparece nos cards de busca. Para trocar, abra outra foto e
              clique em &ldquo;Definir como perfil&rdquo;.
            </p>
          </div>
        )}

        {/* Type sub-tabs */}
        <div className="flex border-b border-line">
          {TYPE_TABS.map((t) => {
            const count = pool.filter((m) => {
              if (t.key === "imagens") return !isVideo(m);
              if (t.key === "videos") return isVideo(m);
              return true;
            }).length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTypeTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  typeTab === t.key
                    ? "-mb-px border-b-2 border-ink text-ink"
                    : "text-ink-dim hover:text-ink",
                )}
              >
                {t.label}{" "}
                <span className="text-2xs tabular-nums text-ink-faint">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum item aqui ainda"
            description="Adicione fotos ou vídeos no painel à direita."
            icon={<ImagePlus className="h-10 w-10" strokeWidth={1.5} />}
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {shown.map((m) => {
                const globalIdx = filtered.indexOf(m);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={cn(
                      "group relative overflow-hidden rounded-xl bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      m.isCover
                        ? "ring-2 ring-rose"
                        : "ring-1 ring-line",
                    )}
                    style={{ aspectRatio: "1/1" }}
                    onClick={() => setLightbox(globalIdx)}
                  >
                    {isVideo(m) ? (
                      <video
                        src={m.url}
                        className="h-full w-full object-cover transition duration-200 group-hover:brightness-75"
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={m.url}
                        alt=""
                        fill
                        className="object-cover transition duration-200 group-hover:brightness-75"
                        sizes="33vw"
                      />
                    )}
                    {isVideo(m) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-ink/55 p-3">
                          <Play
                            className="h-4 w-4 fill-white text-white"
                            strokeWidth={0}
                          />
                        </div>
                      </div>
                    )}
                    {m.isCover && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-rose px-2 py-[2px] text-2xs font-semibold uppercase tracking-wider text-white">
                        Capa
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {hasMore && (
              <div className="pt-2 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Ver mais · {filtered.length - visible} restantes
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RIGHT: sticky upload panel ── */}
      <div className="h-fit space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
        <div>
          <p className="text-md font-semibold tracking-[-0.011em] text-ink">
            Adicionar mídia
          </p>
          <p className="mt-0.5 text-sm text-ink-dim">
            Foto ou vídeo para o seu perfil.
          </p>
        </div>

        {/* Preview grid or drop zone */}
        {previews.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {previews.map((src, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl bg-line/30"
                style={{ aspectRatio: "1/1" }}
              >
                {pendingFiles[i]?.type.startsWith("video") ? (
                  <video
                    src={src}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- preview de upload local (blob URL); next/image exige domain whitelist e não funciona com objectURL
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPendingFiles((f) =>
                      f.filter((_, j) => j !== i),
                    );
                    setPreviews((p) =>
                      p.filter((_, j) => j !== i),
                    );
                  }}
                  aria-label="Remover"
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/65 text-white backdrop-blur-sm transition hover:bg-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center rounded-xl border border-dashed border-line bg-white text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)] hover:border-rose/40 hover:bg-rose-soft hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ aspectRatio: "1/1" }}
            >
              <Plus className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-12 text-ink-dim transition-all duration-150 ease-[var(--ease-tahoe)] hover:border-rose/40 hover:bg-rose-soft hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ImagePlus className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-md font-semibold">
              Selecionar arquivos
            </span>
            <span className="text-xs text-ink-faint">
              JPG, PNG, WebP, MP4, WebM · máx 50MB
            </span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Caption */}
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
            {!uploadPublic ? (
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
                {uploadPublic ? "Público" : "Privado"}
              </p>
              <p className="text-xs text-ink-dim">
                {uploadPublic
                  ? "Visível para todos"
                  : "Só assinantes veem"}
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
        <Button
          type="button"
          onClick={uploadFiles}
          disabled={!pendingFiles.length || uploading}
          loading={uploading}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {uploading
            ? "Enviando…"
            : pendingFiles.length > 0
              ? `Publicar ${pendingFiles.length} arquivo${pendingFiles.length > 1 ? "s" : ""
              }`
              : "Publicar"}
        </Button>

        {!uploadPublic && (
          <p className="text-xs text-ink-dim">
            Conteúdo explícito permitido na galeria privada.
          </p>
        )}
      </div>

      {/* ── Full-screen lightbox ── */}
      <Modal
        open={!!curItem}
        onClose={closeLb}
        position="fullscreen"
        className="flex w-full touch-none flex-col bg-black"
      >
        {curItem && (
          <>
            {/* Top bar */}
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <button
                onClick={closeLb}
                className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-sm">Voltar</span>
              </button>
              <p className="text-xs tabular-nums text-white/40">
                {lightbox! + 1} / {filtered.length}
              </p>
              <div className="w-20" />
            </div>

            {/* Media area */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              {isVideo(curItem) ? (
                <video
                  src={curItem.url}
                  controls
                  autoPlay
                  className="max-h-full max-w-full"
                />
              ) : (
                <Image
                  src={curItem.url}
                  alt=""
                  width={900}
                  height={1200}
                  className="max-h-full max-w-full object-contain"
                  priority
                />
              )}

              {/* Nav arrows */}
              {filtered.length > 1 && (
                <>
                  <button
                    onClick={prevLb}
                    aria-label="Anterior"
                    className="absolute left-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                  >
                    <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={nextLb}
                    aria-label="Próxima"
                    className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                  >
                    <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom info + actions */}
            <div className="shrink-0 border-t border-white/10 px-5 py-4">
              <div className="mx-auto max-w-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      @{profileSlug ?? "–"}
                    </p>
                    <p className="text-xs tabular-nums text-white/40">
                      {fmtDate(curItem.createdAt)}
                    </p>
                    {curItem.caption && (
                      <p className="mt-2 text-sm leading-relaxed text-white/85">
                        {curItem.caption}
                      </p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2">
                    {visTab === "publica" && !curItem.isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(curItem.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                      >
                        <Star className="h-3 w-3" strokeWidth={1.75} />
                        Definir perfil
                      </button>
                    )}
                    {curItem.isCover ? (
                      <p className="max-w-[120px] text-center text-2xs text-white/35">
                        Defina outra foto de perfil antes de remover
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemove(curItem.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-rose hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                        Remover
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

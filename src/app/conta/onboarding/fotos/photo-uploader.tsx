"use client";

import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFileUpload } from "@/lib/hooks/use-file-upload";
import { cn } from "@/lib/utils";

type Props = { coverUrl: string | null };

/**
 * ProfilePhotoUploader — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/conta/onboarding/fotos/photo-uploader.tsx
 * Steering: `.kiro/steering/design-system.md` §6, §7 (mídia).
 *
 * Avatar XL (160×160) clicável com upload progressivo, ring rose quando
 * tem foto, dashed line quando vazio. Hover overlay rose-soft com ícone
 * câmera.
 */
export function ProfilePhotoUploader({ coverUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const { upload } = useFileUpload({
    endpoint: "/api/upload",
    onError: setError,
  });

  const displayUrl = previewUrl ?? coverUrl;

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const data = await upload(file, { isPublic: "true" });
    if (!data) {
      setPreviewUrl(null);
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={displayUrl ? "Trocar foto de perfil" : "Escolher foto de perfil"}
        className={cn(
          "group relative h-40 w-40 overflow-hidden rounded-full ring-2 ring-offset-4 ring-offset-background",
          "transition-all duration-200 ease-[var(--ease-tahoe)] active:scale-[0.96] disabled:opacity-70",
          "focus-visible:outline-none focus-visible:ring-rose/50",
          displayUrl ? "ring-rose" : "ring-line",
        )}
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt=""
              fill
              className="object-cover"
              sizes="160px"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-all group-hover:bg-ink/40">
              <Camera
                className="h-7 w-7 text-white opacity-0 transition-all group-hover:opacity-100"
                strokeWidth={2}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-dashed border-line bg-line/30 transition-all group-hover:border-rose group-hover:bg-rose-soft">
            <Camera
              className="h-10 w-10 text-ink-dim transition-colors group-hover:text-rose"
              strokeWidth={1.5}
            />
            <span className="mt-2 text-xs font-medium text-ink-dim transition-colors group-hover:text-rose">
              Escolher foto
            </span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" strokeWidth={2} />
          </div>
        )}
      </button>

      {displayUrl && !uploading && (
        <p className="text-base font-medium text-success">✓ Foto definida</p>
      )}
      {!displayUrl && !uploading && (
        <p className="text-base text-ink-dim">Toque para escolher</p>
      )}
      {uploading && <p className="text-base text-ink-dim">Enviando…</p>}

      {displayUrl && !uploading && (
        <p className="text-xs text-ink-faint">Clique na foto para trocar</p>
      )}

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

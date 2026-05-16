"use client";

import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = { coverUrl: string | null };

export function ProfilePhotoUploader({ coverUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  const displayUrl = previewUrl ?? coverUrl;

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    // Show instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("isPublic", "true");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar foto.");
        setPreviewUrl(null);
      }
    } catch {
      setError("Erro de conexão.");
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

      {/* Clickable circle */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "group relative h-40 w-40 overflow-hidden rounded-full ring-2 ring-offset-4 ring-offset-[#f5f5f7] transition-all active:scale-[0.96] disabled:opacity-70 focus-visible:outline-none",
          displayUrl ? "ring-coral" : "ring-black/[0.08]",
        )}
      >
        {displayUrl ? (
          <>
            <Image src={displayUrl} alt="Foto de perfil" fill className="object-cover" sizes="160px" />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
              <Camera className="h-7 w-7 text-white opacity-0 transition-all group-hover:opacity-100" strokeWidth={1.5} />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black/[0.04] border-2 border-dashed border-black/[0.12] rounded-full transition-all group-hover:border-coral group-hover:bg-coral/[0.04]">
            <Camera className="h-10 w-10 text-muted transition-colors group-hover:text-coral" strokeWidth={1.2} />
            <span className="mt-2 text-[11px] font-medium text-muted transition-colors group-hover:text-coral">
              Escolher foto
            </span>
          </div>
        )}

        {/* Loading spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" strokeWidth={1.5} />
          </div>
        )}
      </button>

      {/* Status text */}
      {displayUrl && !uploading && (
        <p className="text-[13px] font-medium text-[#248a3d]">✓ Foto definida</p>
      )}
      {!displayUrl && !uploading && (
        <p className="text-[13px] text-muted">Toque para escolher</p>
      )}
      {uploading && (
        <p className="text-[13px] text-muted">Enviando…</p>
      )}

      {/* Hint to change */}
      {displayUrl && !uploading && (
        <p className="text-[11px] text-muted/60">Clique na foto para trocar</p>
      )}

      {error && <p className="mt-1 text-[12px] text-coral">{error}</p>}
    </div>
  );
}

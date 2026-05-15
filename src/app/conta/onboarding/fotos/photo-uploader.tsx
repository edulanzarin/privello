"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { isPublic: boolean };

export function PhotoUploader({ isPublic }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("isPublic", String(isPublic));

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar foto.");
        break;
      }
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex h-32 w-32 flex-col items-center justify-center gap-2 border-2 border-dashed border-line bg-white text-muted transition hover:border-coral hover:text-coral disabled:opacity-50"
      >
        {uploading
          ? <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
          : <ImagePlus className="h-6 w-6" strokeWidth={1.25} />
        }
        <span className="text-[11px] font-semibold">
          {uploading ? "Enviando…" : "Adicionar"}
        </span>
      </button>
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}

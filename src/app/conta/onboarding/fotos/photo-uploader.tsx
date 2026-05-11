"use client";

import { ImagePlus } from "lucide-react";
import { useState, useTransition } from "react";
import { addPhotoByUrl } from "@/app/_actions/onboarding";

export function PhotoUploader({ isPublic }: { isPublic: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!url.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set("url", url.trim());
    fd.set("isPublic", String(isPublic));
    startTransition(async () => {
      const res = await addPhotoByUrl(fd);
      if (res?.error) { setError(res.error); return; }
      setUrl("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-28 w-28 flex-col items-center justify-center gap-1 border border-dashed border-line bg-white text-[10px] font-semibold uppercase text-muted hover:border-foreground/30"
      >
        <ImagePlus className="h-6 w-6" strokeWidth={1.25} />
        Adicionar
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 border border-line bg-white p-4 sm:max-w-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {isPublic ? "Foto pública" : "Foto privada"} — cole a URL
      </p>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-foreground"
        autoFocus
      />
      {error && <p className="text-xs text-coral">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !url.trim()}
          className="flex-1 bg-foreground py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {pending ? "Adicionando…" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setUrl(""); setError(null); }}
          className="border border-line px-4 py-2 text-xs text-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

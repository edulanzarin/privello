"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { uploadClientAvatarAction } from "@/app/_actions/client-profile";
import { Avatar } from "@/components/ui/avatar";

interface ClientAvatarUploadProps {
    currentImage: string | null;
    userName: string | null;
}

/**
 * ClientAvatarUpload — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/conta/perfil/client-avatar-upload.tsx
 * Steering: `.kiro/steering/design-system.md` §6.
 *
 * Avatar XL com hover-overlay de câmera + spinner durante upload. Usa
 * `<Avatar>` primitivo com `ringColor="rose"`.
 */
export function ClientAvatarUpload({ currentImage, userName }: ClientAvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage);
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        // Upload
        const fd = new FormData();
        fd.set("avatar", file);
        startTransition(async () => {
            const res = await uploadClientAvatarAction(fd);
            if (res?.url) setPreview(res.url);
        });
    }

    return (
        <div className="group relative">
            <Avatar
                src={preview}
                alt={userName ?? "Perfil"}
                fallback={userName ?? undefined}
                size="xl"
                ring
                ringColor="rose"
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isPending}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50 focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Alterar avatar"
            >
                <Camera className="h-5 w-5 text-white" strokeWidth={2} />
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />
            {isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose border-t-transparent" />
                </div>
            )}
        </div>
    );
}

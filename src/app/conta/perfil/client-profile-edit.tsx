"use client";

import { useState, useTransition } from "react";
import { Settings, X, Check } from "lucide-react";
import { updateClientNameAction, updateClientSlugAction } from "@/app/_actions/client-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

interface ClientProfileEditProps {
    currentName: string;
    currentSlug: string;
}

/**
 * ClientProfileEdit — Design System v2 (Tahoe Sensual).
 *
 * Caminho: src/app/conta/perfil/client-profile-edit.tsx
 * Steering: `.kiro/steering/design-system.md` §6, §13.
 *
 * Modal de edição de nome e @ do cliente. Bottom-sheet em mobile,
 * center em desktop. Trigger é `<Button variant="outline" size="sm">`
 * com ícone Settings.
 *
 * Side effects:
 *  - Server actions `updateClientNameAction` / `updateClientSlugAction`.
 *  - `useTransition` pra estado de loading nos botões Salvar.
 */
export function ClientProfileEdit({ currentName, currentSlug }: ClientProfileEditProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentName);
    const [slug, setSlug] = useState(currentSlug);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const isMobile = useMediaQuery("(max-width: 640px)");

    function handleSaveName() {
        setError(null);
        setSuccess(null);
        const fd = new FormData();
        fd.set("name", name);
        startTransition(async () => {
            const res = await updateClientNameAction(fd);
            if (res?.error) setError(res.error);
            else setSuccess("Nome atualizado!");
        });
    }

    function handleSaveSlug() {
        setError(null);
        setSuccess(null);
        const fd = new FormData();
        fd.set("slug", slug);
        startTransition(async () => {
            const res = await updateClientSlugAction(fd);
            if (res?.error) setError(res.error);
            else setSuccess("@ atualizado!");
        });
    }

    if (!open) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
            >
                <Settings className="h-3.5 w-3.5" strokeWidth={2} />
                Editar
            </Button>
        );
    }

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            position={isMobile ? "bottom" : "center"}
            className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-lg)] animate-fade-in"
        >
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-[-0.015em] text-ink">
                    Editar perfil
                </h2>
                <button
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-line/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Fechar"
                >
                    <X className="h-4 w-4" strokeWidth={2} />
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                    {success}
                </div>
            )}

            <div className="space-y-5">
                {/* Nome */}
                <div>
                    <Input
                        label="Nome"
                        hint="Pode alterar quando quiser"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveName}
                        loading={isPending}
                        className="mt-2"
                    >
                        Salvar nome
                    </Button>
                </div>

                {/* @ */}
                <div>
                    <Input
                        label="@perfil"
                        hint="Só pode alterar 1× por mês"
                        prefix="@"
                        value={slug}
                        onChange={(e) =>
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                        }
                        placeholder="seu-perfil"
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveSlug}
                        loading={isPending}
                        className="mt-2"
                    >
                        Salvar @
                    </Button>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Fechar
                </Button>
            </div>
        </Modal>
    );
}

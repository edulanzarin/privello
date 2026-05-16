"use client";

import { useState, useTransition } from "react";
import { Settings, X, Check } from "lucide-react";
import { updateClientNameAction, updateClientSlugAction } from "@/app/_actions/client-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface ClientProfileEditProps {
    currentName: string;
    currentSlug: string;
}

export function ClientProfileEdit({ currentName, currentSlug }: ClientProfileEditProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentName);
    const [slug, setSlug] = useState(currentSlug);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

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
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/60 px-3 py-2 text-xs font-medium text-muted backdrop-blur-sm transition hover:bg-white/90 hover:text-foreground"
            >
                <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
                Editar
            </button>
        );
    }

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            position="center"
            className="w-full max-w-md rounded-2xl border border-white/30 bg-white/90 p-6 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Editar perfil</h2>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-line transition">
                    <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success flex items-center gap-2">
                    <Check className="h-4 w-4" strokeWidth={2} />
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
                        variant="secondary"
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
                        label="@"
                        hint="Só pode alterar 1x por mês"
                        prefix="@"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="seu-handle"
                    />
                    <Button
                        variant="secondary"
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

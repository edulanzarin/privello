"use client";

import { useState, useCallback } from "react";

type UploadResult = {
    url?: string;
    [key: string]: unknown;
};

type UseFileUploadOptions = {
    /** Endpoint da API de upload */
    endpoint: string;
    /** Tamanho máximo em bytes (default: 20MB) */
    maxSize?: number;
    /** Callback de sucesso */
    onSuccess?: (data: UploadResult) => void;
    /** Callback de erro */
    onError?: (error: string) => void;
};

/**
 * Hook reutilizável para upload de arquivos.
 * Substitui as 3 implementações duplicadas no projeto.
 */
export function useFileUpload({
    endpoint,
    maxSize = 20 * 1024 * 1024,
    onSuccess,
    onError,
}: UseFileUploadOptions) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const upload = useCallback(
        async (file: File, extra?: Record<string, string>): Promise<UploadResult | null> => {
            if (file.size > maxSize) {
                const msg = `Arquivo muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB`;
                onError?.(msg);
                return null;
            }

            setUploading(true);
            setProgress(0);

            try {
                const fd = new FormData();
                fd.set("file", file);
                if (extra) {
                    Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
                }

                const res = await fetch(endpoint, { method: "POST", body: fd });
                const data = await res.json();

                if (!res.ok) {
                    const errorMsg = data.error ?? "Erro ao enviar arquivo.";
                    onError?.(errorMsg);
                    return null;
                }

                setProgress(100);
                onSuccess?.(data);
                return data;
            } catch {
                onError?.("Erro de conexão ao enviar arquivo.");
                return null;
            } finally {
                setUploading(false);
            }
        },
        [endpoint, maxSize, onSuccess, onError],
    );

    return { upload, uploading, progress };
}

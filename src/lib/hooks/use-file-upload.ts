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
    /**
     * Estratégia de upload:
     * - "fetch" (default): usa `fetch()` simples; sem progresso real (apenas 0/100).
     * - "xhr": usa `XMLHttpRequest` para emitir `onProgress` durante o upload.
     */
    strategy?: "fetch" | "xhr";
    /** Callback de progresso 0..100 (real apenas com strategy="xhr"). */
    onProgress?: (percent: number) => void;
    /** Callback de sucesso */
    onSuccess?: (data: UploadResult) => void;
    /** Callback de erro */
    onError?: (error: string) => void;
};

/**
 * Hook reutilizável para upload de arquivos.
 * Substitui as 6+ implementações duplicadas no projeto.
 *
 * Para progresso real durante o upload, passe `strategy: "xhr"`.
 */
export function useFileUpload({
    endpoint,
    maxSize = 20 * 1024 * 1024,
    strategy = "fetch",
    onProgress,
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
            onProgress?.(0);

            try {
                const fd = new FormData();
                fd.set("file", file);
                if (extra) {
                    Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
                }

                if (strategy === "xhr") {
                    const data = await new Promise<UploadResult>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("POST", endpoint);
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                const pct = Math.round((e.loaded / e.total) * 100);
                                setProgress(pct);
                                onProgress?.(pct);
                            }
                        };
                        xhr.onload = () => {
                            try {
                                const body = JSON.parse(xhr.responseText) as UploadResult & { error?: string };
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve(body);
                                } else {
                                    reject(new Error(body.error ?? "Erro ao enviar arquivo."));
                                }
                            } catch {
                                reject(new Error("Resposta inválida do servidor."));
                            }
                        };
                        xhr.onerror = () => reject(new Error("Erro de conexão ao enviar arquivo."));
                        xhr.send(fd);
                    });
                    setProgress(100);
                    onProgress?.(100);
                    onSuccess?.(data);
                    return data;
                }

                // strategy === "fetch"
                const res = await fetch(endpoint, { method: "POST", body: fd });
                const data = await res.json();

                if (!res.ok) {
                    const errorMsg = data.error ?? "Erro ao enviar arquivo.";
                    onError?.(errorMsg);
                    return null;
                }

                setProgress(100);
                onProgress?.(100);
                onSuccess?.(data);
                return data;
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : "Erro de conexão ao enviar arquivo.";
                onError?.(msg);
                return null;
            } finally {
                setUploading(false);
            }
        },
        [endpoint, maxSize, strategy, onProgress, onSuccess, onError],
    );

    return { upload, uploading, progress };
}

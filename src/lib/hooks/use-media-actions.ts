"use client";

import { useState, useCallback } from "react";

type UseMediaActionsOptions = {
    /** ID do usuário logado */
    userId?: string;
};

/**
 * Hook para ações de mídia (like, comentário).
 * Centraliza lógica repetida em media-gallery, reels-feed, etc.
 */
export function useMediaActions({ userId }: UseMediaActionsOptions = {}) {
    const [loadingLike, setLoadingLike] = useState<string | null>(null);
    const [loadingComment, setLoadingComment] = useState(false);

    const toggleLike = useCallback(
        async (mediaId: string): Promise<{ liked: boolean; count: number } | null> => {
            if (!userId) return null;
            setLoadingLike(mediaId);
            try {
                const res = await fetch("/api/media/like", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mediaId }),
                });
                if (!res.ok) return null;
                return await res.json();
            } catch {
                return null;
            } finally {
                setLoadingLike(null);
            }
        },
        [userId],
    );

    const addComment = useCallback(
        async (mediaId: string, text: string): Promise<{ id: string; text: string } | null> => {
            if (!userId || !text.trim()) return null;
            setLoadingComment(true);
            try {
                const res = await fetch("/api/media/comment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mediaId, text: text.trim() }),
                });
                if (!res.ok) return null;
                return await res.json();
            } catch {
                return null;
            } finally {
                setLoadingComment(false);
            }
        },
        [userId],
    );

    return {
        toggleLike,
        addComment,
        loadingLike,
        loadingComment,
    };
}

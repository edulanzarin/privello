"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import type { StoryGroup } from "@/lib/services";

const STORY_DURATION = 5000;

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "agora há pouco";
    if (h < 24) return `há ${h}h`;
    return "há 1 dia";
}

/**
 * StoryViewer — modal fullscreen compartilhado para visualização de stories.
 *
 * Caminho: src/components/stories/story-viewer.tsx
 * Steering: `.kiro/steering/design-system.md` §15.
 *
 * Centraliza toda a lógica de viewer (progress bar, autoavanço 5s, view tracking,
 * like otimista com rollback, navegação por teclado, tap zones, marcar visto via
 * sessionStorage) que antes estava duplicada em `story-bar.tsx` e
 * `profile-story-cover.tsx`.
 *
 * Modos:
 *  - **Multi-group** (StoryBar): `groups` com N grupos, mostra setas chevron
 *    pra navegar entre grupos quando há > 1.
 *  - **Single-group** (ProfileStoryCover): `groups` com 1 grupo — esconde
 *    chevrons automaticamente.
 *
 * Props:
 *  - `groups`: lista de StoryGroup. Quando vazia ou primeiro index inválido, retorna null.
 *  - `initialGroupIdx`: grupo inicial aberto.
 *  - `initialStoryIdx?`: story inicial dentro do grupo (default 0).
 *  - `onClose`: chamado quando o usuário fecha (Esc, X, fim do último grupo).
 *  - `onChange?`: notifica o consumer sobre updates de estado interno
 *    (likes, views) pra ele atualizar caches/listas externas.
 *  - `isClient`: usuário logado (libera curtir + tracking server-side de view).
 *
 * Side effects (mantidos do design v1):
 *  - `fetch("/api/stories/view", { method: "POST" })` ao abrir cada story (se isClient).
 *  - `fetch("/api/stories/like", { method: "POST" })` no toggle (otimista + rollback).
 *  - `sessionStorage` `prv_seen` persiste vistos.
 *  - `requestAnimationFrame` + `setTimeout(5000)` pra progress bar.
 *  - Listener `keydown` (Esc, ←, →) enquanto aberto.
 */
export function StoryViewer({
    groups: initialGroups,
    initialGroupIdx,
    initialStoryIdx = 0,
    onClose,
    onChange,
    isClient,
}: {
    groups: StoryGroup[];
    initialGroupIdx: number;
    initialStoryIdx?: number;
    onClose: () => void;
    onChange?: (groups: StoryGroup[]) => void;
    isClient: boolean;
}) {
    const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
    const [storyIdx, setStoryIdx] = useState(initialStoryIdx);
    const [progress, setProgress] = useState(0);
    const [groups, setGroups] = useState(initialGroups);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef(0);
    const pathname = usePathname();

    // Sync state up to parent quando groups mudam (likes, views).
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    useEffect(() => {
        onChangeRef.current?.(groups);
    }, [groups]);

    const activeGroup = groups[groupIdx] ?? null;
    const activeStory = activeGroup?.stories[storyIdx] ?? null;
    const hasMultipleGroups = groups.length > 1;

    const stopTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, []);

    const close = useCallback(() => {
        stopTimers();
        onClose();
    }, [stopTimers, onClose]);

    const goNextStory = useCallback(() => {
        if (!activeGroup) return;
        if (storyIdx < activeGroup.stories.length - 1) {
            setStoryIdx((i) => i + 1);
            setProgress(0);
        } else if (groupIdx < groups.length - 1) {
            setGroupIdx((i) => i + 1);
            setStoryIdx(0);
            setProgress(0);
        } else {
            close();
        }
    }, [activeGroup, storyIdx, groupIdx, groups.length, close]);

    const goPrevStory = useCallback(() => {
        if (storyIdx > 0) {
            setStoryIdx((i) => i - 1);
            setProgress(0);
        } else if (groupIdx > 0) {
            const prevGroup = groups[groupIdx - 1];
            setGroupIdx((i) => i - 1);
            setStoryIdx(prevGroup.stories.length - 1);
            setProgress(0);
        }
    }, [storyIdx, groupIdx, groups]);

    const jumpGroup = useCallback(
        (dir: 1 | -1) => {
            const next = groupIdx + dir;
            if (next < 0 || next >= groups.length) return;
            setGroupIdx(next);
            setStoryIdx(0);
            setProgress(0);
        },
        [groupIdx, groups.length],
    );

    // Progress bar + autoavanço
    useEffect(() => {
        if (!activeStory) return;
        stopTimers();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset progress ao trocar de story
        setProgress(0);
        startTimeRef.current = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
            setProgress(pct);
            if (pct < 100) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        timerRef.current = setTimeout(goNextStory, STORY_DURATION);

        return stopTimers;
    }, [groupIdx, storyIdx, activeStory, goNextStory, stopTimers]);

    // Track view: sessionStorage sempre + API se logado
    useEffect(() => {
        if (!activeStory) return;
        try {
            const seen = new Set<string>(JSON.parse(sessionStorage.getItem("prv_seen") ?? "[]"));
            seen.add(activeStory.id);
            sessionStorage.setItem("prv_seen", JSON.stringify([...seen]));
        } catch {
            /* ignore */
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- marca como visto
        setGroups((prev) =>
            prev.map((g, gi) => {
                if (gi !== groupIdx) return g;
                const stories = g.stories.map((s, si) =>
                    si !== storyIdx
                        ? s
                        : {
                            ...s,
                            seenByMe: true,
                            viewCount: s.seenByMe ? s.viewCount : s.viewCount + 1,
                        },
                );
                return { ...g, stories, allSeen: stories.every((s) => s.seenByMe) };
            }),
        );
        if (isClient) {
            fetch("/api/stories/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId: activeStory.id }),
            }).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupIdx, storyIdx]);

    // Teclado (scroll lock + data-modal-open são gerenciados por Modal/useScrollLock)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowRight") goNextStory();
            if (e.key === "ArrowLeft") goPrevStory();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
        };
    }, [close, goNextStory, goPrevStory]);

    const [likePending, startLikeTransition] = useTransition();

    async function toggleLike() {
        if (!activeStory || !isClient || likePending) return;
        const gIdx = groupIdx;
        const sIdx = storyIdx;
        const prevLiked = activeStory.likedByMe;
        const prevCount = activeStory.likeCount;
        const nextLiked = !prevLiked;
        const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

        setGroups((prev) =>
            prev.map((g, gi) =>
                gi !== gIdx
                    ? g
                    : {
                        ...g,
                        stories: g.stories.map((s, si) =>
                            si !== sIdx ? s : { ...s, likedByMe: nextLiked, likeCount: nextCount },
                        ),
                    },
            ),
        );

        startLikeTransition(async () => {
            try {
                const res = await fetch("/api/stories/like", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storyId: activeStory.id, liked: nextLiked }),
                });
                if (!res.ok) throw new Error("like failed");
            } catch {
                setGroups((prev) =>
                    prev.map((g, gi) =>
                        gi !== gIdx
                            ? g
                            : {
                                ...g,
                                stories: g.stories.map((s, si) =>
                                    si !== sIdx ? s : { ...s, likedByMe: prevLiked, likeCount: prevCount },
                                ),
                            },
                    ),
                );
            }
        });
    }

    if (!activeGroup || !activeStory) return null;

    return (
        <Modal
            open
            onClose={close}
            position="fullscreen"
            className="bg-black/90 backdrop-blur-sm flex items-center justify-center w-full touch-none"
        >
            {/* Card container */}
            <div
                className="relative mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden sm:h-[90vh] sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress bars */}
                <div className="absolute inset-x-0 top-0 z-30 flex gap-1 p-2 pt-3">
                    {activeGroup.stories.map((s, si) => (
                        <div
                            key={s.id}
                            className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
                        >
                            <div
                                className="h-full rounded-full bg-white"
                                style={{
                                    width:
                                        si < storyIdx
                                            ? "100%"
                                            : si === storyIdx
                                                ? `${progress}%`
                                                : "0%",
                                    transition: si === storyIdx ? "none" : undefined,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Top bar */}
                <div className="absolute inset-x-0 top-0 z-30 flex items-center gap-2 px-3 pb-2 pt-7">
                    <Link
                        href={`/p/${activeGroup.slug}`}
                        onClick={close}
                        className="flex min-w-0 flex-1 items-center gap-2"
                    >
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white/60">
                            <Image
                                src={activeGroup.coverUrl}
                                alt={activeGroup.displayName}
                                fill
                                className="object-cover"
                                sizes="36px"
                            />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold leading-tight text-white">
                                {activeGroup.displayName}
                            </span>
                            <span className="mt-0.5 block text-2xs text-white/60">
                                {timeAgo(activeStory.createdAt)}
                            </span>
                        </span>
                    </Link>
                    <button
                        onClick={close}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                        aria-label="Fechar"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                </div>

                {/* Story media */}
                <div className="relative flex-1 bg-black">
                    <Image
                        src={activeStory.mediaUrl}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                    />
                    {activeStory.caption && (
                        <div className="absolute inset-x-0 bottom-20 px-4">
                            <p className="mx-auto max-w-[90%] rounded-xl bg-black/60 px-4 py-2.5 text-center text-sm text-white backdrop-blur-sm">
                                {activeStory.caption}
                            </p>
                        </div>
                    )}
                </div>

                {/* Tap zones */}
                <div
                    className="absolute inset-x-0 z-20"
                    style={{ top: "15%", bottom: "15%" }}
                >
                    <div className="flex h-full">
                        <button
                            type="button"
                            className="flex-1 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                goPrevStory();
                            }}
                            aria-label="Anterior"
                        />
                        <button
                            type="button"
                            className="flex-1 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                goNextStory();
                            }}
                            aria-label="Próximo"
                        />
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-12">
                    <span className="flex items-center gap-1.5 text-sm text-white/70">
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                        <span className="tabular-nums">{activeStory.viewCount}</span>
                    </span>
                    {isClient ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLike();
                            }}
                            disabled={likePending}
                            className="pointer-events-auto inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm text-white disabled:opacity-60"
                            aria-label={activeStory.likedByMe ? "Descurtir story" : "Curtir story"}
                        >
                            <Heart
                                className={cn(
                                    "h-6 w-6 transition",
                                    activeStory.likedByMe
                                        ? "fill-rose text-rose scale-110"
                                        : "text-white/80",
                                )}
                                strokeWidth={1.5}
                            />
                            <span className="text-xs tabular-nums text-white/70">
                                {activeStory.likeCount}
                            </span>
                        </button>
                    ) : (
                        <Link
                            href={`/entrar?callbackUrl=${encodeURIComponent(pathname)}`}
                            className="pointer-events-auto text-2xs text-white/50 transition hover:text-white/80"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Entre para curtir
                        </Link>
                    )}
                </div>
            </div>

            {/* Profile chevrons (multi-group only) */}
            {hasMultipleGroups && groupIdx > 0 && (
                <button
                    onClick={() => jumpGroup(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-4"
                    aria-label="Perfil anterior"
                >
                    <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                </button>
            )}
            {hasMultipleGroups && groupIdx < groups.length - 1 && (
                <button
                    onClick={() => jumpGroup(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-4"
                    aria-label="Próximo perfil"
                >
                    <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
                </button>
            )}
        </Modal>
    );
}

import { z } from "zod";

/** `GET /api/media/comment?mediaId=...`. */
export const CommentListQuerySchema = z.object({
    mediaId: z.string().cuid(),
});
export type CommentListQuery = z.infer<typeof CommentListQuerySchema>;

/** `POST /api/media/comment`. */
export const CommentBodySchema = z.object({
    mediaId: z.string().cuid(),
    text: z.string().trim().min(1).max(500),
});
export type CommentBody = z.infer<typeof CommentBodySchema>;

/** `DELETE /api/media/comment`. */
export const CommentDeleteBodySchema = z.object({
    commentId: z.string().cuid(),
});
export type CommentDeleteBody = z.infer<typeof CommentDeleteBodySchema>;

/** `POST /api/media/like`. */
export const MediaLikeBodySchema = z.object({
    mediaId: z.string().cuid(),
    liked: z.boolean(),
});
export type MediaLikeBody = z.infer<typeof MediaLikeBodySchema>;

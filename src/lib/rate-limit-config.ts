/**
 * Canonical rate-limit table for the Privello API surface.
 *
 * Each entry describes the per-endpoint budget enforced by `rateLimit` from
 * `./rate-limit`. The numeric literals are kept as multiplications
 * (`15 * 60`, `60 * 60`) so the human-readable intent ("15 minutes",
 * "1 hour") is visible at the call site instead of an opaque seconds value.
 *
 * Spec references:
 *   - requirements.md > Requirement 5.1 (limites por endpoint)
 *   - requirements.md > Requirement 5.2 (escopo da chave por endpoint)
 *   - design.md > Data Models > RateLimitTable
 *   - rate-limits.md (mirrors this table in prose; created in task 5.3)
 */

import type { RateLimitConfig, RateLimitScope } from "./rate-limit";

/**
 * Per-endpoint rate-limit budgets.
 *
 * Source of truth: `design.md > Data Models > RateLimitTable`. Any change
 * here MUST be reflected in `rate-limits.md` (and vice versa).
 */
export const RATE_LIMIT_TABLE = {
    /** Login attempts: 5 per 15 minutes, scoped by client IP. */
    login: { scope: "ip", windowSec: 15 * 60, limit: 5 },
    /** Uploads: 20 per hour, scoped by authenticated user. */
    upload: { scope: "user", windowSec: 60 * 60, limit: 20 },
    /** WhatsApp click-through: 10 per hour, scoped per (ip, profile) pair. */
    waClick: { scope: "ip+profile", windowSec: 60 * 60, limit: 10 },
    /** Comment posts: 5 per minute, scoped by authenticated user. */
    comment: { scope: "user", windowSec: 60, limit: 5 },
    /** Story view increments: 1 per hour, scoped per (user, story) pair. */
    storyView: { scope: "user+story", windowSec: 60 * 60, limit: 1 },
} as const satisfies Record<
    string,
    { scope: RateLimitScope; windowSec: number; limit: number }
>;

/**
 * Endpoint identifier accepted by `rateLimitConfigFor`. Derived from the
 * canonical table so adding/removing entries automatically propagates to
 * call sites.
 */
export type RateLimitedEndpoint = keyof typeof RATE_LIMIT_TABLE;

/**
 * Builds a full `RateLimitConfig` from the canonical table entry for
 * `endpoint`, combined with the caller-resolved `key` (e.g. ip, userId,
 * `${profileId}:${ip}`).
 *
 * Intended call shape:
 *
 *   rateLimit(rateLimitConfigFor("upload", userId));
 *
 * The returned object is a fresh value, so callers may safely mutate it
 * without affecting the canonical table.
 */
export function rateLimitConfigFor(
    endpoint: RateLimitedEndpoint,
    key: string,
): RateLimitConfig {
    const entry = RATE_LIMIT_TABLE[endpoint];
    return {
        scope: entry.scope,
        windowSec: entry.windowSec,
        limit: entry.limit,
        key,
    };
}

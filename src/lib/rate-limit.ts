/**
 * Rate limiter primitive for `fase-1-seguranca` Requirement 5.
 *
 * Exposes a small, store-agnostic API that callers (login, `/api/upload`,
 * `/api/wa-click`, comments, story view) can use to enforce per-key request
 * budgets. The default store is an in-memory `Map` scoped to the current Node
 * process — it is the MVP store called for in `design.md > Boundaries`.
 *
 * IMPORTANT — single-instance only:
 *   The default in-memory store **only works correctly when the app runs as a
 *   single Node process** (current production topology). In a multi-instance
 *   deployment each replica would carry its own counters and the effective
 *   rate would multiply by the number of replicas. Migrating to a shared
 *   store (Redis / Upstash) is registered as `OutOfScopeFinding` for
 *   `fase-7-dx-infra` (see `requirements.md > §3` and
 *   `design.md > Boundaries` / `Error Handling`).
 *
 * Design notes:
 *   - The `RateLimiterStore.incr` contract returns BOTH `count` and `resetAt`
 *     so `rateLimit` can compute `retryAfter` deterministically without a
 *     second round-trip. This is a deliberate extension of the sketch in
 *     `design.md > Components and Interfaces > 3` (which left `incr` as
 *     `Promise<number>`); without `resetAt` the caller cannot compute
 *     `retryAfter`. A Redis-backed implementation can map this trivially
 *     onto `INCR` + `PEXPIRE` + `PTTL`.
 *   - The cleanup interval uses `setInterval(...).unref()` so it never
 *     blocks process exit. It is also skipped when `NODE_ENV === "test"`
 *     so unit/property tests don't leak handles. Tests interact with the
 *     store directly and drive `Date.now()` via `vi.useFakeTimers()` (see
 *     task 9.1).
 *
 * Spec references:
 *   - requirements.md > Requirement 5 (5.1, 5.3)
 *   - design.md > Components and Interfaces > 3. src/lib/rate-limit.ts
 *   - design.md > Correctness Properties > Property 1, 2, 3
 */

export type RateLimitScope = "ip" | "user" | "ip+profile" | "user+story";

export interface RateLimitConfig {
    scope: RateLimitScope;
    /** Caller-resolved key (e.g. ip, userId, `${profileId}:${ip}`). */
    key: string;
    /** Window length in seconds. */
    windowSec: number;
    /** Maximum allowed requests per window. */
    limit: number;
}

export interface RateLimitResult {
    allowed: boolean;
    /** Seconds until the window resets. Only set when `allowed === false`. */
    retryAfter?: number;
    /** Remaining requests in the current window (clamped at 0). */
    remaining: number;
}

/**
 * Pluggable storage backend for `rateLimit`.
 *
 * Implementations MUST atomically:
 *   1. Read the current entry for `key`.
 *   2. If absent or expired, create a fresh entry with `count = 1` and
 *      `resetAt = now + windowSec * 1000`, then return `{ count: 1, resetAt }`.
 *   3. Otherwise increment `count` (preserving `resetAt`) and return the new
 *      values.
 *
 * The default in-memory implementation provided by this module satisfies the
 * contract under Node's single-threaded event loop. A Redis implementation
 * would use `INCR` + conditional `PEXPIRE` and read TTL via `PTTL`.
 */
export interface RateLimiterStore {
    incr(
        key: string,
        windowSec: number,
    ): Promise<{ count: number; resetAt: number }>;
}

type Entry = { count: number; resetAt: number };

/** Cleanup cadence for expired entries in the in-memory store. */
const CLEANUP_INTERVAL_MS = 60_000;

/**
 * Default in-memory `RateLimiterStore`. See module-level docstring for the
 * single-instance caveat.
 */
export class InMemoryRateLimiterStore implements RateLimiterStore {
    private readonly entries = new Map<string, Entry>();
    private readonly cleanupTimer: NodeJS.Timeout | null;

    constructor() {
        // Skip the cleanup interval in test environments — tests are short
        // lived and drive timers manually via `vi.useFakeTimers()`. Keeping a
        // real interval running would leak handles and confuse fake timers.
        if (process.env.NODE_ENV === "test") {
            this.cleanupTimer = null;
            return;
        }

        const timer = setInterval(() => {
            this.cleanup();
        }, CLEANUP_INTERVAL_MS);
        // `unref()` lets Node exit even if this timer is still pending.
        timer.unref();
        this.cleanupTimer = timer;
    }

    async incr(
        key: string,
        windowSec: number,
    ): Promise<{ count: number; resetAt: number }> {
        const now = Date.now();
        const existing = this.entries.get(key);

        if (!existing || now >= existing.resetAt) {
            const fresh: Entry = {
                count: 1,
                resetAt: now + windowSec * 1000,
            };
            this.entries.set(key, fresh);
            return { count: fresh.count, resetAt: fresh.resetAt };
        }

        existing.count += 1;
        return { count: existing.count, resetAt: existing.resetAt };
    }

    /**
     * Removes expired entries. Exposed for tests; production code relies on
     * the periodic interval scheduled in the constructor.
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.entries) {
            if (now >= entry.resetAt) {
                this.entries.delete(key);
            }
        }
    }

    /**
     * Stops the periodic cleanup interval. Useful when the store is replaced
     * at runtime (e.g. swapping in a Redis-backed implementation). Idempotent.
     */
    dispose(): void {
        if (this.cleanupTimer !== null) {
            clearInterval(this.cleanupTimer);
        }
    }
}

/**
 * Process-wide default store. Lazily instantiated on first call to
 * `rateLimit` so importing this module doesn't schedule timers eagerly (which
 * would matter for build-time imports and serverless cold starts that never
 * actually rate-limit).
 */
let defaultStore: RateLimiterStore | null = null;

function getDefaultStore(): RateLimiterStore {
    if (defaultStore === null) {
        defaultStore = new InMemoryRateLimiterStore();
    }
    return defaultStore;
}

/**
 * Increments the counter for `${scope}:${key}` within a `windowSec` window
 * and returns whether the request is allowed.
 *
 * Storage key composition: `${scope}:${key}`. The `scope` prefix prevents
 * collisions between, e.g., `ip` keys and `user` keys that happen to share a
 * literal value.
 *
 * Contract:
 *   - `allowed = count <= limit`
 *   - `remaining = max(0, limit - count)`
 *   - `retryAfter = ceil((resetAt - now) / 1000)` when `!allowed`, otherwise
 *     `undefined`.
 *
 * @param config Rate limit configuration (scope, key, window, limit).
 * @param store  Optional store override; defaults to the in-memory store.
 */
export async function rateLimit(
    config: RateLimitConfig,
    store: RateLimiterStore = getDefaultStore(),
): Promise<RateLimitResult> {
    const storageKey = `${config.scope}:${config.key}`;
    const { count, resetAt } = await store.incr(storageKey, config.windowSec);

    const allowed = count <= config.limit;
    const remaining = Math.max(0, config.limit - count);

    if (allowed) {
        return { allowed: true, remaining };
    }

    const retryAfter = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    return { allowed: false, remaining, retryAfter };
}

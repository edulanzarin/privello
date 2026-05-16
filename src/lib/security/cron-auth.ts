/**
 * Auth helper for Cron_Endpoints (`/api/cron/**`).
 *
 * Implements Requirement 2 of `fase-1-seguranca`:
 *   - Accepts the cron secret via three channels, in priority order:
 *       1. `Authorization: Bearer <CRON_SECRET>`         → source: "header-authorization"
 *       2. `X-Cron-Secret: <CRON_SECRET>`                → source: "header-x-cron-secret"
 *       3. `?secret=<CRON_SECRET>` (deprecated, transition only) → source: "query-secret-deprecated"
 *   - All comparisons are constant-time (`crypto.timingSafeEqual`), with the
 *     length-mismatch fast path taken BEFORE calling `timingSafeEqual`
 *     (which throws on differing buffer lengths).
 *   - During the transition window, the query-string fallback is accepted but
 *     emits a structured warning (rota, ip, recommendation).
 *   - After `transitionEndsAt`, query-string-only requests are rejected
 *     ({ ok: false }); requests that ALSO carry a valid Authorization or
 *     X-Cron-Secret header still succeed via the header path.
 *   - When `CRON_SECRET` is not configured, every request is rejected. The
 *     calling route handler is responsible for the HTTP shape (401, no body).
 *
 * Spec references:
 *   - requirements.md > Requirement 2 (2.2, 2.3, 2.4, 2.5)
 *   - design.md > Components and Interfaces > 2. src/lib/security/cron-auth.ts
 *   - design.md > Correctness Properties > Property 5, Property 6
 */

import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

export type CronAuthSource =
    | "header-authorization"
    | "header-x-cron-secret"
    | "query-secret-deprecated";

export type CronAuthResult =
    | { ok: true; source: CronAuthSource; warning?: string }
    | { ok: false };

export type CronAuthOptions = {
    /**
     * Instant at which the query-string transition window ends. After this
     * date, requests that carry the secret only via `?secret=` are rejected.
     */
    transitionEndsAt: Date;
    /**
     * Reference instant for the transition check. Defaults to `new Date()`.
     * Exposed for testability (Property 5/6 use fake timers).
     */
    now?: Date;
};

/**
 * Warning string returned alongside successful query-string authentications
 * during the transition window. Exposed so route handlers and tests can
 * reference the canonical message.
 */
export const CRON_QUERY_DEPRECATED_WARNING =
    "/api/cron secret via query string is deprecated; " +
    "migrate to `Authorization: Bearer <CRON_SECRET>` or `X-Cron-Secret` header.";

/**
 * Constant-time comparison of two strings. Handles length mismatch BEFORE
 * calling `timingSafeEqual` (which throws on differing buffer lengths).
 *
 * Note: returning early on length mismatch leaks the length of the expected
 * secret. `CRON_SECRET` is operator-controlled (not user input), so this is
 * acceptable for the threat model.
 */
function safeEqual(provided: string, expected: string): boolean {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

/**
 * Parses `Authorization: Bearer <token>` and returns the token portion, or
 * `null` if the header is absent or malformed.
 */
function extractBearerToken(req: Request): string | null {
    const header = req.headers.get("authorization");
    if (!header) return null;

    const [scheme, ...rest] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer") return null;

    const token = rest.join(" ").trim();
    return token.length > 0 ? token : null;
}

/**
 * Reads the `X-Cron-Secret` header and returns it trimmed, or `null` when
 * absent/empty.
 */
function extractCronHeader(req: Request): string | null {
    const value = req.headers.get("x-cron-secret");
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Reads `?secret=` from the request URL. Returns `null` when absent/empty
 * or when the URL cannot be parsed.
 */
function extractQuerySecret(req: Request): string | null {
    let url: URL;
    try {
        url = new URL(req.url);
    } catch {
        return null;
    }
    const value = url.searchParams.get("secret");
    if (!value) return null;
    return value.length > 0 ? value : null;
}

/**
 * Extracts the most-likely client IP from `x-forwarded-for`. Returns "unknown"
 * when the header is absent or empty. Mirrors the helper in `dev-auth.ts`.
 */
function extractClientIp(req: Request): string {
    const xff = req.headers.get("x-forwarded-for");
    if (!xff) return "unknown";

    const first = xff
        .split(",")
        .map((part) => part.trim())
        .find((part) => part.length > 0);

    return first ?? "unknown";
}

/**
 * Returns the request pathname, or `"unknown"` when the URL cannot be parsed.
 */
function extractPathname(req: Request): string {
    try {
        return new URL(req.url).pathname;
    } catch {
        return "unknown";
    }
}

/**
 * Logs the deprecated-query-string usage as structured JSON. Per Requirement
 * 2.3, the warning carries the route, the client IP, and the migration
 * recommendation.
 */
function logQueryDeprecation(req: Request): void {
    console.warn(
        JSON.stringify({
            event: "cron_secret_query_string_deprecated",
            ts: new Date().toISOString(),
            route: extractPathname(req),
            ip: extractClientIp(req),
            recommendation: CRON_QUERY_DEPRECATED_WARNING,
        }),
    );
}

/**
 * Verifies that a cron request carries the configured `CRON_SECRET` via one
 * of the accepted channels. See module-level docstring for the full contract.
 *
 * Order of checks:
 *   1. `Authorization: Bearer <CRON_SECRET>` (highest priority).
 *   2. `X-Cron-Secret: <CRON_SECRET>`.
 *   3. `?secret=<CRON_SECRET>` (only while `now <= transitionEndsAt`).
 */
export function verifyCronSecret(
    req: Request,
    opts: CronAuthOptions,
): CronAuthResult {
    const expected = process.env.CRON_SECRET;
    if (!expected || expected.length === 0) {
        return { ok: false };
    }

    // 1) Authorization: Bearer <secret> — highest priority.
    const bearer = extractBearerToken(req);
    if (bearer !== null && safeEqual(bearer, expected)) {
        return { ok: true, source: "header-authorization" };
    }

    // 2) X-Cron-Secret: <secret>.
    const headerSecret = extractCronHeader(req);
    if (headerSecret !== null && safeEqual(headerSecret, expected)) {
        return { ok: true, source: "header-x-cron-secret" };
    }

    // 3) ?secret=<secret> — accepted only during the transition window.
    const querySecret = extractQuerySecret(req);
    if (querySecret !== null && safeEqual(querySecret, expected)) {
        const now = opts.now ?? new Date();
        if (now.getTime() <= opts.transitionEndsAt.getTime()) {
            logQueryDeprecation(req);
            return {
                ok: true,
                source: "query-secret-deprecated",
                warning: CRON_QUERY_DEPRECATED_WARNING,
            };
        }
        // Window closed: fall through to rejection.
    }

    return { ok: false };
}

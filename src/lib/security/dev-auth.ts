/**
 * Auth helper for Dev_Endpoints (`/api/dev/**`).
 *
 * Implements Requirement 1 of `fase-1-seguranca`:
 *   - Accepts either (a) `Authorization: Bearer <DEV_ENDPOINT_TOKEN>` (constant-time compare)
 *     or (b) NextAuth session whose `role` is in {ADMIN, MODERATOR}.
 *   - In production without credentials → 404 (hides endpoint existence).
 *   - In dev without credentials → 401 with guidance message.
 *   - Logs successful invocations as structured JSON.
 *
 * Spec references:
 *   - requirements.md > Requirement 1 (1.2, 1.3, 1.4)
 *   - design.md > Components and Interfaces > 1. src/lib/security/dev-auth.ts
 */

import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { auth } from "@/lib/auth";

export type DevAuthMode = "session" | "token";

export type DevAuthContext = {
    mode: DevAuthMode;
    /**
     * Identifier for the authenticated subject. For `session` mode this is the
     * user id. For `token` mode this is the first 6 characters of the token
     * (never the full secret), per Requirement 1.4.
     */
    subject: string;
};

export type DevAuthResult =
    | { ok: true; ctx: DevAuthContext }
    | { ok: false; status: 401 | 404 };

const ADMIN_ROLES = new Set(["ADMIN", "MODERATOR"]);

/**
 * Extracts the most-likely client IP from `x-forwarded-for`. Returns "unknown"
 * when the header is absent or empty.
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
 * Constant-time comparison of two strings. Handles length mismatch BEFORE
 * calling `timingSafeEqual` (which throws on differing buffer lengths).
 *
 * Note: returning early on length mismatch leaks the length of the expected
 * secret. The expected token's length is fixed by `process.env.DEV_ENDPOINT_TOKEN`
 * and not user-controlled input, so this is acceptable for the threat model.
 */
function safeEqual(provided: string, expected: string): boolean {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

/**
 * Parses `Authorization: Bearer <token>` and returns the token portion, or
 * `null` if the header is missing or malformed.
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
 * Logs a successful Dev_Endpoint invocation as structured JSON.
 * Centralized logger is OutOfScopeFinding for this phase; using console.info
 * with stringified JSON keeps the log machine-readable in the meantime.
 */
function logSuccess(ctx: DevAuthContext, ip: string): void {
    console.info(
        JSON.stringify({
            event: "dev_endpoint_auth_success",
            ts: new Date().toISOString(),
            ip,
            mode: ctx.mode,
            subject: ctx.subject,
        }),
    );
}

/**
 * Authorizes a Dev_Endpoint request. See module-level docstring for contract.
 *
 * Order of checks:
 *   1. If `DEV_ENDPOINT_TOKEN` is configured and the request carries a matching
 *      bearer token, accept as `token` mode.
 *   2. Otherwise consult the NextAuth session and accept if `role ∈ {ADMIN, MODERATOR}`.
 *   3. Miss → 404 in production (hide existence) or 401 in dev (guidance).
 */
export async function requireAdminOrToken(req: Request): Promise<DevAuthResult> {
    const ip = extractClientIp(req);
    const isProduction = process.env.NODE_ENV === "production";

    // 1) Token mode — only attempted when DEV_ENDPOINT_TOKEN is configured.
    const expectedToken = process.env.DEV_ENDPOINT_TOKEN;
    if (expectedToken && expectedToken.length > 0) {
        const provided = extractBearerToken(req);
        if (provided && safeEqual(provided, expectedToken)) {
            const ctx: DevAuthContext = {
                mode: "token",
                subject: provided.slice(0, 6),
            };
            logSuccess(ctx, ip);
            return { ok: true, ctx };
        }
    }

    // 2) Session mode — admin or moderator role grants access.
    const session = await auth();
    const role = session?.user?.role;
    if (session?.user?.id && typeof role === "string" && ADMIN_ROLES.has(role)) {
        const ctx: DevAuthContext = {
            mode: "session",
            subject: session.user.id,
        };
        logSuccess(ctx, ip);
        return { ok: true, ctx };
    }

    // 3) No valid credential.
    return { ok: false, status: isProduction ? 404 : 401 };
}

/**
 * Standard guidance message for the 401 response in development. Route
 * handlers can include this in the response body.
 */
export const DEV_AUTH_UNAUTHORIZED_MESSAGE =
    "Dev endpoint requires either an admin/moderator session or " +
    "`Authorization: Bearer <DEV_ENDPOINT_TOKEN>` header.";

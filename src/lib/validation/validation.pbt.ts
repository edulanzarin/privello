// src/lib/validation/validation.pbt.ts
//
// Property 4 (idempotência de `parse`) para um subset curado de schemas Zod.
//
// Definição da Property 4 (`design.md > Correctness Properties`): para cada
// schema `S` desta fase e todo input `v` aceito por `S`,
// `S.parse(S.parse(v))` é estruturalmente igual a `S.parse(v)`.
//
// O objetivo é flagrar `.transform()` (ou efeitos análogos como `default`,
// `coerce`, `trim`, `toLowerCase`) que mudem a forma do output a cada
// chamada. Esses casos "explodem" em retries/retry-after e em qualquer fluxo
// que reparse o objeto em camadas (action → handler → service).
//
// Subset curado (8 schemas) — escolhido por padrão de transform, não por
// volume:
//
//   1. WaClickBodySchema           → `.default()` em `source`
//   2. MediaLikeBodySchema         → shape simples (regressão básica)
//   3. StoriesViewBodySchema       → shape simples (regressão básica)
//   4. ReviewBodySchema            → `.trim()` + `.nullable().optional()`
//   5. LoginActionSchema           → `.toLowerCase()` em email
//   6. UpdateClientNameSchema      → `.trim()` puro
//   7. UpdateClientSlugSchema      → trim + toLowerCase + regex (combo)
//   8. ProfilesSectionQuerySchema  → `z.coerce.number()` + `.default(0)`
//
// Cobertura completa dos ~60 schemas seria redundante — os 8 acima já
// exercitam todo padrão de transform usado em `src/lib/validation/`.
//
// Este arquivo cumpre o task 9.2 de `tasks.md` desta fase.

import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import {
    WaClickBodySchema,
    MediaLikeBodySchema,
    StoriesViewBodySchema,
    ReviewBodySchema,
    LoginActionSchema,
    UpdateClientNameSchema,
    UpdateClientSlugSchema,
    ProfilesSectionQuerySchema,
} from "@/lib/validation";

// ─────────────────────────────────────────────────────────────────────────────
// Geradores compartilhados
// ─────────────────────────────────────────────────────────────────────────────

/** CUID simples — começa com `c` seguido de 24 chars `[a-z0-9]`. */
const cuid = fc.stringMatching(/^c[a-z0-9]{24}$/);

/** Slug do `ReviewBodySchema` (regex `/^[a-z0-9][a-z0-9-]*$/`). */
const reviewSlug = fc.stringMatching(/^[a-z0-9][a-z0-9-]{0,40}$/);

/**
 * Slug do `UpdateClientSlugSchema` (regex full `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`
 * + min(3) + max(30)).
 */
const clientSlug = fc.stringMatching(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/);

/** Email ASCII previsível: `<local>@<domain>.<tld>`. */
const email = fc
    .tuple(
        fc.stringMatching(/^[a-z]{3,10}$/),
        fc.stringMatching(/^[a-z]{3,10}$/),
        fc.stringMatching(/^[a-z]{2,5}$/),
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: roda a propriedade contra um schema arbitrário.
// ─────────────────────────────────────────────────────────────────────────────

function expectIdempotent<S extends { parse: (v: unknown) => unknown }>(
    schema: S,
    input: unknown,
) {
    const once = schema.parse(input);
    const twice = schema.parse(once);
    expect(twice).toEqual(once);
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 4 — idempotência por schema
// ─────────────────────────────────────────────────────────────────────────────

describe("validation / Property 4 (idempotência de parse)", () => {
    // **Validates: Requirements 4.1, 4.5** (Property 4 — `WaClickBodySchema`)
    test.prop([
        fc.record(
            {
                profileId: cuid,
                // `source` aceita ausência (`default("perfil")`) ou string ≤50.
                // Usamos chars ASCII simples para evitar surpresas com surrogate
                // pairs no `.max(50)` (o limite é por code unit em zod 3.23).
                source: fc.option(
                    fc.stringMatching(/^[a-zA-Z0-9 _-]{0,50}$/),
                    { nil: undefined },
                ),
            },
            { requiredKeys: ["profileId"] },
        ),
    ])("WaClickBodySchema", (input) => {
        expectIdempotent(WaClickBodySchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `MediaLikeBodySchema`)
    test.prop([
        fc.record({
            mediaId: cuid,
            liked: fc.boolean(),
        }),
    ])("MediaLikeBodySchema", (input) => {
        expectIdempotent(MediaLikeBodySchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `StoriesViewBodySchema`)
    test.prop([
        fc.record({
            storyId: cuid,
        }),
    ])("StoriesViewBodySchema", (input) => {
        expectIdempotent(StoriesViewBodySchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `ReviewBodySchema`)
    test.prop([
        fc.record(
            {
                profileSlug: reviewSlug,
                rating: fc.integer({ min: 1, max: 5 }),
                // `comment` é nullable + optional. Os três estados são
                // distintos: ausente, null explícito, string trim+max(1000).
                comment: fc.oneof(
                    fc.constant(undefined),
                    fc.constant(null),
                    fc.stringMatching(/^[a-zA-Z0-9 .,!?-]{0,500}$/),
                ),
            },
            { requiredKeys: ["profileSlug", "rating"] },
        ),
    ])("ReviewBodySchema", (input) => {
        expectIdempotent(ReviewBodySchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `LoginActionSchema`)
    test.prop([
        fc.record(
            {
                email,
                password: fc.string({ minLength: 1, maxLength: 64 }),
                callbackUrl: fc.option(
                    fc.stringMatching(/^[a-zA-Z0-9/_-]{0,80}$/),
                    { nil: undefined },
                ),
            },
            { requiredKeys: ["email", "password"] },
        ),
    ])("LoginActionSchema", (input) => {
        expectIdempotent(LoginActionSchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `UpdateClientNameSchema`)
    test.prop([
        fc.record({
            // 2..60 chars sem whitespace nas pontas (o trim é idempotente em
            // qualquer caso, mas geramos o input já "limpo" para focar em
            // exercitar o pipeline de transforms — não a validação de borda).
            name: fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,58}[A-Za-z]$/),
        }),
    ])("UpdateClientNameSchema", (input) => {
        expectIdempotent(UpdateClientNameSchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `UpdateClientSlugSchema`)
    test.prop([
        fc.record({
            slug: clientSlug,
        }),
    ])("UpdateClientSlugSchema", (input) => {
        expectIdempotent(UpdateClientSlugSchema, input);
    });

    // **Validates: Requirements 4.1, 4.5** (Property 4 — `ProfilesSectionQuerySchema`)
    test.prop([
        fc.record(
            {
                type: fc.constantFrom("hot", "boosted"),
                // `offset` é `coerce.number().int().min(0).default(0)`. Geramos
                // três formas: undefined (vira default), número direto, string
                // numérica (testa o `coerce`).
                offset: fc.oneof(
                    fc.constant(undefined),
                    fc.integer({ min: 0, max: 10_000 }),
                    fc
                        .integer({ min: 0, max: 10_000 })
                        .map((n) => String(n)),
                ),
            },
            { requiredKeys: ["type"] },
        ),
    ])("ProfilesSectionQuerySchema", (input) => {
        expectIdempotent(ProfilesSectionQuerySchema, input);
    });
});

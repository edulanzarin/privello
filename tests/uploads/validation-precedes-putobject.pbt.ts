// tests/uploads/validation-precedes-putobject.pbt.ts
//
// Feature: migracao-infra-producao, Property 6: Validação de MIME/tamanho precede putObject
// Validates: Requirements 2.2, 3.2, 4.2, 6.2, NFR-SEC-4
//
// Property 6 — cross-site invariant. Para cada um dos 4 upload sites
// (3 HTTP route handlers + 1 server action), em qualquer dispatch onde o
// MIME do arquivo é INVÁLIDO ou o tamanho EXCEDE o teto da rota, o handler
// SHALL responder 4xx (HTTP) ou `{ error }` (server action) e o
// `Storage_Module.putObject` SHALL ser invocado exatamente 0 vezes.
//
// Sites cobertos (ver requirements.md > Glossary > Upload_Endpoints):
//   1. POST /api/upload                 — Requirement 2.2
//   2. POST /api/upload-audio           — Requirement 3.2
//   3. POST /api/upload/verification    — Requirement 4.2
//   4. uploadClientAvatarAction         — Requirement 6.2
//
// O 5º site (`registerProviderAction` em `_actions/auth.ts`) NÃO é coberto
// aqui: o spec (tasks.md > 3.11 + design.md > Components > 5) explicita
// que ele não tem caminho de "validação rejeita com 4xx" — uploads ali
// são non-fatal, e a action sempre completa o cadastro com `signIn(...)`.
// Property 6 só faz sentido nos 4 sites com rejeição explícita.
//
// Estratégia de mock (espelha conventions de `route.test.ts` adjacente):
//   - `@/lib/storage` é mockado integralmente: `putObject` é `vi.fn()`
//     que registramos `not.toHaveBeenCalled()` em cada run.
//   - `@/lib/auth` retorna sessão fixa.
//   - `@/lib/prisma` mocka apenas as superfícies usadas pelos handlers.
//   - `@/lib/rate-limit` retorna `{ allowed: true }` para liberar o site
//     `upload` que tem rate limit.
//
// Memory note: oversized testing aloca buffers no range `[limit+1, limit*2]`.
// Para os 4 sites o teto é 20 MB (audio), portanto o pior caso é uma
// alocação de ~40 MB por run. Mantemos `numRuns` modestos (20 para MIME
// inválido, 10 para oversized) para limitar a duração total do PBT.
//
// Cross-refs:
//   - .kiro/specs/migracao-infra-producao/requirements.md > Requirement
//     2.2, 3.2, 4.2, 6.2 + NFR-SEC-4.
//   - .kiro/specs/migracao-infra-producao/design.md > Components and
//     Interfaces > 2, 3, 4, 6.
//   - .kiro/specs/migracao-infra-producao/tasks.md > Task 3.11.

import { afterEach, beforeEach, describe, expect, vi } from "vitest";
import { test, fc } from "@fast-check/vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks compartilhados — declarados via `vi.hoisted` para que o estado
// inicialize antes do `vi.mock` factory ser invocado pelo Vitest e antes
// do import dos handlers/actions abaixo.
// ─────────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
    putObject: vi.fn(),
    deleteObject: vi.fn(),
    auth: vi.fn(),
    rateLimit: vi.fn(),
    profileFindUnique: vi.fn(),
    profileUpdate: vi.fn(),
    profileUpdateMany: vi.fn(),
    mediaCreate: vi.fn(),
    mediaCount: vi.fn(),
    userUpdate: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
    putObject: mocks.putObject,
    deleteObject: mocks.deleteObject,
}));

vi.mock("@/lib/auth", () => ({
    auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findUnique: mocks.profileFindUnique,
            update: mocks.profileUpdate,
            updateMany: mocks.profileUpdateMany,
        },
        media: {
            create: mocks.mediaCreate,
            count: mocks.mediaCount,
        },
        user: {
            update: mocks.userUpdate,
        },
    },
}));

vi.mock("@/lib/rate-limit", () => ({
    rateLimit: mocks.rateLimit,
}));

// Imports após `vi.mock` para que cada handler resolva os módulos mockados.
import { POST as uploadPost } from "@/app/api/upload/route";
import { POST as uploadAudioPost } from "@/app/api/upload-audio/route";
import { POST as uploadVerificationPost } from "@/app/api/upload/verification/route";
import { uploadClientAvatarAction } from "@/app/_actions/client-profile";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Fixture-tabela por site (Allowed_MIMEs, Max_Bytes, Harness)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resultado normalizado de cada harness. HTTP routes devolvem
 * `{ kind: "http", status, body }`; server actions devolvem
 * `{ kind: "action", result }`. A asserção de "rejeitado" (4xx ou
 * `{ error }`) é uniforme via `expectRejected`.
 */
type HarnessResult =
    | { kind: "http"; status: number; body: unknown }
    | { kind: "action"; result: unknown };

type Site = {
    /** Nome legível para identificação dos test cases. */
    name: string;
    /** MIMEs aceitos pela rota (consultado para gerar `invalidMimes`). */
    allowed: readonly string[];
    /**
     * Teto de bytes USADO no gerador de oversize. Para sites com branches
     * separadas image/video, escolhemos o limite **menor** (image) — assim
     * a alocação por run fica bounded e o teste cobre o branch sem precisar
     * gerar buffers de centenas de MB. O outro branch é coberto pelos
     * unit tests dedicados de cada rota.
     */
    oversizedLimit: number;
    /** MIME válido (dentro de `allowed`) usado para os testes de tamanho. */
    oversizedMime: string;
    /** Filename neutro — usado tanto para invalid-MIME quanto oversized. */
    filename: string;
    /** Dispatch fn isolada do caller: recebe File, retorna resultado uniforme. */
    harness: (file: File) => Promise<HarnessResult>;
};

/**
 * MIMEs universais "claramente inválidos" para os 4 sites — nenhum deles
 * aparece nas allowed lists de upload, upload-audio, upload-verification
 * ou client-avatar. Útil como pool comum, mas filtramos por-site contra
 * `site.allowed` defensivamente para resistir a mudanças nas tabelas.
 */
const UNIVERSAL_INVALID_MIMES = [
    "application/pdf",
    "text/plain",
    "application/octet-stream",
    "application/zip",
    "text/html",
    "application/xml",
    "application/json",
    "font/woff2",
] as const;

/** Helper: constrói NextRequest com FormData multipart contendo o `file`. */
function buildHttpRequest(url: string, file: File): NextRequest {
    const fd = new FormData();
    fd.append("file", file);
    const headers = new Headers();
    // Setamos `content-length` igual ao tamanho declarado do File. Para o
    // site `upload` o teto absoluto do header é 200 MB + 1 KB; para
    // `upload-audio` é 20 MB + 1 KB. Em ambos os casos, oversize testado
    // aqui (até 2× do limit menor) cai em 4xx (400 ou 413) — ambos
    // satisfazem Property 6.
    headers.set("content-length", String(file.size));
    return new NextRequest(url, {
        method: "POST",
        body: fd,
        headers,
    });
}

const SITES: readonly Site[] = [
    {
        name: "upload",
        // src/app/api/upload/route.ts > ALLOWED_IMAGES + ALLOWED_VIDEOS
        allowed: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
        ],
        // Branch image: 8 MB (menor entre IMAGE_MAX 8 MB e VIDEO_MAX 200 MB).
        oversizedLimit: 8 * 1024 * 1024,
        oversizedMime: "image/jpeg",
        filename: "test.bin",
        async harness(file) {
            const req = buildHttpRequest("http://localhost/api/upload", file);
            const res = await uploadPost(req);
            const body = await res.json();
            return { kind: "http", status: res.status, body };
        },
    },
    {
        name: "upload-audio",
        // src/app/api/upload-audio/route.ts > ALLOWED
        allowed: [
            "audio/mpeg",
            "audio/mp3",
            "audio/wav",
            "audio/ogg",
            "audio/mp4",
            "audio/webm",
            "audio/x-m4a",
        ],
        // MAX_AUDIO_BYTES = 20 MB.
        oversizedLimit: 20 * 1024 * 1024,
        oversizedMime: "audio/mpeg",
        // `.bin` propositalmente NÃO bate com o regex
        // `/\.(mp3|wav|ogg|m4a|webm)$/i` do handler — assim, em invalid-MIME
        // tests, isAudio = false e a rejeição vem do MIME (não do filename).
        filename: "test.bin",
        async harness(file) {
            const req = buildHttpRequest(
                "http://localhost/api/upload-audio",
                file,
            );
            const res = await uploadAudioPost(req);
            const body = await res.json();
            return { kind: "http", status: res.status, body };
        },
    },
    {
        name: "upload-verification",
        // src/app/api/upload/verification/route.ts > ALLOWED_IMG + ALLOWED_VIDEO
        allowed: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif",
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-msvideo",
        ],
        // Branch image: 10 MB (menor entre 10 MB e 150 MB).
        oversizedLimit: 10 * 1024 * 1024,
        oversizedMime: "image/jpeg",
        filename: "test.bin",
        async harness(file) {
            const req = buildHttpRequest(
                "http://localhost/api/upload/verification",
                file,
            );
            const res = await uploadVerificationPost(req);
            const body = await res.json();
            return { kind: "http", status: res.status, body };
        },
    },
    {
        name: "uploadClientAvatarAction",
        // src/app/_actions/client-profile.ts > allowed
        allowed: ["image/jpeg", "image/png", "image/webp"],
        // Limite hardcoded 5 MB no action.
        oversizedLimit: 5 * 1024 * 1024,
        oversizedMime: "image/jpeg",
        filename: "test.bin",
        async harness(file) {
            const fd = new FormData();
            fd.append("avatar", file);
            const result = await uploadClientAvatarAction(fd);
            return { kind: "action", result };
        },
    },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Asserter compartilhado — Property 6
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Asserta a forma "rejeitado" do resultado:
 *   - HTTP: status ∈ [400, 500) E body tem chave `error`.
 *   - Action: result tem chave `error`.
 *
 * Ambas as formas satisfazem o invariante "rejeição estruturada antes do
 * `putObject`" da Property 6 (NFR-SEC-4 + Requirement 2.2/3.2/4.2/6.2).
 */
function expectRejected(result: HarnessResult): void {
    if (result.kind === "http") {
        // 4xx (400 inclusive até 499 inclusive). Excluímos 5xx (que
        // indicaria falha do `putObject`, não rejeição de validação).
        expect(result.status).toBeGreaterThanOrEqual(400);
        expect(result.status).toBeLessThan(500);
        // `parsed.error.flatten()` (Zod) NÃO tem chave `error` direta, mas
        // o caminho de Property 6 (MIME inválido / size excedido) sempre
        // retorna o NextResponse `{ error: "..." }` do handler — Zod
        // só verifica `instanceof File`, e nossas Files são sempre válidas
        // como instâncias.
        expect(result.body).toHaveProperty("error");
    } else {
        expect(result.result).toHaveProperty("error");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset entre runs
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    mocks.putObject.mockReset();
    // Default resolve com URL placeholder — mas Property 6 é justamente
    // que `putObject` NUNCA é invocado, então este valor jamais retorna
    // ao caller; serve só de sentinela caso uma regressão chame o módulo.
    mocks.putObject.mockResolvedValue("https://test.invalid/should-not-be-used");
    mocks.deleteObject.mockReset();
    mocks.auth.mockReset();
    mocks.auth.mockResolvedValue({ user: { id: "test-user-id" } });
    mocks.rateLimit.mockReset();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.profileFindUnique.mockReset();
    mocks.profileFindUnique.mockResolvedValue({
        id: "test-profile-id",
        userId: "test-user-id",
    });
    mocks.profileUpdate.mockReset();
    mocks.profileUpdate.mockResolvedValue({});
    mocks.profileUpdateMany.mockReset();
    mocks.profileUpdateMany.mockResolvedValue({ count: 1 });
    mocks.mediaCreate.mockReset();
    mocks.mediaCreate.mockResolvedValue({});
    mocks.mediaCount.mockReset();
    mocks.mediaCount.mockResolvedValue(0);
    mocks.userUpdate.mockReset();
    mocks.userUpdate.mockResolvedValue({});
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 6
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 6: Validação de MIME/tamanho precede putObject", () => {
    // Feature: migracao-infra-producao, Property 6: Validação de MIME/tamanho precede putObject
    // Validates: Requirements 2.2, 3.2, 4.2, 6.2, NFR-SEC-4

    for (const site of SITES) {
        // Filtro defensivo: se algum MIME do pool universal aparecer no
        // allowed da rota (regressão futura), o teste descarta. Em todas
        // as 4 rotas de hoje, todos os MIMEs do pool são inválidos.
        const invalidMimesForSite = UNIVERSAL_INVALID_MIMES.filter(
            (m) => !site.allowed.includes(m),
        );

        // ─── Sub-property: MIME inválido ────────────────────────────────────
        test.prop(
            [fc.constantFrom(...invalidMimesForSite)],
            { numRuns: 20 },
        )(
            `[${site.name}] MIME inválido nunca chama putObject e responde 4xx/{error}`,
            async (mime) => {
                // Arquivo pequeno (64 bytes) — o que importa é o MIME
                // mismatch. O handler nunca lê os bytes neste branch.
                const file = new File([new Uint8Array(64)], site.filename, {
                    type: mime,
                });
                const result = await site.harness(file);

                expectRejected(result);
                expect(mocks.putObject).not.toHaveBeenCalled();
            },
        );

        // ─── Sub-property: tamanho excedente ────────────────────────────────
        test.prop(
            [
                fc.integer({
                    min: site.oversizedLimit + 1,
                    max: site.oversizedLimit * 2,
                }),
            ],
            { numRuns: 10 },
        )(
            `[${site.name}] tamanho > ${site.oversizedLimit} bytes nunca chama putObject e responde 4xx/{error}`,
            async (size) => {
                // Aloca um Uint8Array zerado de `size` bytes — o handler
                // valida `file.size > limit` ANTES de chamar
                // `file.arrayBuffer()`, então em teoria o conteúdo nunca
                // é lido; mas o multipart parsing do `req.formData()`
                // ainda processa os bytes na transferência. Mantemos
                // numRuns em 10 para limitar throughput.
                const oversized = new Uint8Array(size);
                const file = new File([oversized], site.filename, {
                    type: site.oversizedMime,
                });
                const result = await site.harness(file);

                expectRejected(result);
                expect(mocks.putObject).not.toHaveBeenCalled();
            },
        );
    }
});

/**
 * src/app/api/upload/route.test.ts
 *
 * Tests do route handler `POST /api/upload` após o refactor para
 * `Storage_Module` (`src/lib/storage.ts`).
 *
 * Casos cobertos:
 *
 *   - **POST sucesso (imagem normal)**: `putObject` é chamado com a
 *     Object_Key `uploads/<profileId>/<filename>`; a URL retornada é
 *     persistida em `Media.url` via `prisma.media.create`; resposta `200
 *     { ok: true, media }` com shape preservado (Requirement 2.1, 2.5).
 *
 *   - **POST sucesso (REEL/story)**: `putObject` é chamado, mas
 *     `prisma.media.create` **não** é chamado — caller (action) cria a
 *     `Media`. Resposta `200 { ok: true, url }` (Requirement 2.3).
 *
 *   - **POST falha do `putObject`**: HTTP 500 com payload pt-BR
 *     `{ error: "Falha ao enviar arquivo." }` e `console.warn` chamado uma
 *     vez com o shape estruturado `{ ts, endpoint: "upload", key, ownerId,
 *     contentType, size, error }` (Requirement 2.4, NFR-OBS-1, NFR-OBS-2).
 *
 *   - **POST validação inválida (MIME ruim)**: HTTP 400 e `putObject`
 *     **não** é chamado — compõe Property 6 (Requirement 2.2,
 *     NFR-COMPAT-2).
 *
 *   - **POST validação inválida (tamanho > limite)**: HTTP 400 e
 *     `putObject` **não** é chamado — compõe Property 6 (Requirement 2.2,
 *     NFR-COMPAT-2).
 *
 *   - **Static check**: o source `route.ts` não importa `fs/promises` nem
 *     `path` — toda escrita passa exclusivamente pelo `Storage_Module`
 *     (Requirement 2.7).
 *
 * Estratégia de mock:
 *
 *   - `@/lib/storage` é mockado integralmente: `putObject` é `vi.fn()` que
 *     pode ser configurado por teste.
 *   - `@/lib/auth` exporta apenas `auth()` mockado.
 *   - `@/lib/prisma` expõe `prisma.profile.findUnique` e
 *     `prisma.media.{create,count}`.
 *   - `@/lib/rate-limit` retorna `{ allowed: true }` por default.
 *
 * Cross-refs:
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` > Requirement 2
 *     (2.2, 2.4, 2.7) e NFR-COMPAT-2.
 *   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
 *     Interfaces > 2. `src/app/api/upload/route.ts`.
 *   - `.kiro/specs/migracao-infra-producao/tasks.md` > Task 3.2.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/lib/storage", () => ({
    putObject: vi.fn(),
    deleteObject: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        profile: {
            findUnique: vi.fn(),
        },
        media: {
            create: vi.fn(),
            count: vi.fn(),
        },
    },
}));

vi.mock("@/lib/rate-limit", () => ({
    rateLimit: vi.fn(),
}));

// Imports após `vi.mock` para que as referências resolvam os módulos mockados.
import { POST } from "./route";
import { putObject } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de mocks tipados
// ─────────────────────────────────────────────────────────────────────────────

const mockedPutObject = putObject as unknown as ReturnType<typeof vi.fn>;
const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedRateLimit = rateLimit as unknown as ReturnType<typeof vi.fn>;
const mockedPrisma = prisma as unknown as {
    profile: { findUnique: ReturnType<typeof vi.fn> };
    media: {
        create: ReturnType<typeof vi.fn>;
        count: ReturnType<typeof vi.fn>;
    };
};

const TEST_USER_ID = "user-123";
const TEST_PROFILE_ID = "profile-abc";

/** Constrói um `NextRequest` POST com `FormData` contendo o `file` e
 *  campos opcionais. */
function buildPostRequest(
    file: File,
    extra: Record<string, string> = {},
    contentLengthOverride?: number,
): NextRequest {
    const fd = new FormData();
    fd.append("file", file);
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);

    const headers = new Headers();
    headers.set(
        "content-length",
        String(contentLengthOverride ?? file.size),
    );

    return new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: fd,
        headers,
    });
}

beforeEach(() => {
    mockedPutObject.mockReset();
    mockedAuth.mockReset();
    mockedRateLimit.mockReset();
    mockedPrisma.profile.findUnique.mockReset();
    mockedPrisma.media.create.mockReset();
    mockedPrisma.media.count.mockReset();

    // Defaults — testes específicos podem sobrescrever.
    mockedAuth.mockResolvedValue({ user: { id: TEST_USER_ID } });
    mockedRateLimit.mockResolvedValue({ allowed: true });
    mockedPrisma.profile.findUnique.mockResolvedValue({
        id: TEST_PROFILE_ID,
        userId: TEST_USER_ID,
    });
    mockedPrisma.media.count.mockResolvedValue(0);
    mockedPrisma.media.create.mockImplementation(
        async ({ data }: { data: Record<string, unknown> }) => ({
            id: "media-xyz",
            ...data,
        }),
    );
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — sucesso (imagem normal)
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload — sucesso imagem (Requirement 2.1, 2.5)", () => {
    it("persiste a URL de putObject em Media.url e retorna 200 { ok, media }", async () => {
        const expectedUrl =
            "https://pub-test.r2.dev/uploads/profile-abc/123-x.jpg";
        mockedPutObject.mockResolvedValueOnce(expectedUrl);

        const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", {
            type: "image/jpeg",
        });
        const req = buildPostRequest(file);

        const res = await POST(req);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(body.media).toBeDefined();
        expect(body.media.url).toBe(expectedUrl);
        expect(body.media.profileId).toBe(TEST_PROFILE_ID);
        expect(body.media.isCover).toBe(true); // primeira foto pública
        expect(body.media.sortOrder).toBe(0);
        expect(body.media.mediaType).toBe("IMAGE");
        expect(body.media.isPublic).toBe(true);

        // putObject foi chamado uma vez com a Object_Key esperada
        // (`uploads/<profileId>/<file>`).
        expect(mockedPutObject).toHaveBeenCalledTimes(1);
        const [key, buffer, contentType] = mockedPutObject.mock.calls[0] as [
            string,
            Buffer,
            string,
        ];
        expect(key).toMatch(/^uploads\/profile-abc\/\d+-[a-z0-9]+\.jpg$/);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(contentType).toBe("image/jpeg");

        // Media.create foi chamado com a URL retornada por putObject.
        expect(mockedPrisma.media.create).toHaveBeenCalledTimes(1);
        const createArg = mockedPrisma.media.create.mock.calls[0]?.[0] as {
            data: Record<string, unknown>;
        };
        expect(createArg.data).toMatchObject({
            profileId: TEST_PROFILE_ID,
            url: expectedUrl,
            isPublic: true,
            sortOrder: 0,
            isCover: true,
            mediaType: "IMAGE",
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — sucesso (REEL/story branch)
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload — branch REEL/story (Requirement 2.3)", () => {
    it("REEL: retorna { ok, url } e NÃO chama prisma.media.create", async () => {
        const expectedUrl =
            "https://pub-test.r2.dev/uploads/profile-abc/999-y.mp4";
        mockedPutObject.mockResolvedValueOnce(expectedUrl);

        const file = new File(
            [new Uint8Array([0x00, 0x00, 0x00, 0x18])],
            "reel.mp4",
            { type: "video/mp4" },
        );
        const req = buildPostRequest(file, { mediaType: "REEL" });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toEqual({ ok: true, url: expectedUrl });

        expect(mockedPutObject).toHaveBeenCalledTimes(1);
        // Caller (action createReel) é responsável pela Media — handler não cria.
        expect(mockedPrisma.media.create).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — falha do putObject
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload — falha do putObject (Requirement 2.4)", () => {
    it("retorna HTTP 500 com mensagem pt-BR e emite console.warn estruturado", async () => {
        const sdkErr = new Error("NetworkingError: connection refused");
        mockedPutObject.mockRejectedValueOnce(sdkErr);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
        vi.spyOn(console, "info").mockImplementation(() => { });

        const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "broken.jpg", {
            type: "image/jpeg",
        });
        const req = buildPostRequest(file);

        const res = await POST(req);
        expect(res.status).toBe(500);

        const body = await res.json();
        expect(body).toEqual({ error: "Falha ao enviar arquivo." });

        // putObject foi tentado (e rejeitou).
        expect(mockedPutObject).toHaveBeenCalledTimes(1);

        // Em falha, NÃO persiste nada em DB.
        expect(mockedPrisma.media.create).not.toHaveBeenCalled();

        // Log estruturado: shape exato esperado pelo design.
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const logged = warnSpy.mock.calls[0]?.[0] as Record<string, unknown>;
        expect(logged).toMatchObject({
            endpoint: "upload",
            ownerId: TEST_PROFILE_ID,
            contentType: "image/jpeg",
            size: file.size,
            error: sdkErr.message,
        });
        expect(typeof logged.ts).toBe("number");
        expect(typeof logged.key).toBe("string");
        expect(logged.key as string).toMatch(
            /^uploads\/profile-abc\/\d+-[a-z0-9]+\.jpg$/,
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — validação inválida NÃO chama putObject (compõe Property 6)
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload — validação precede putObject (Requirement 2.2, NFR-COMPAT-2)", () => {
    it("MIME inválido → 400 e putObject NÃO é chamado", async () => {
        const file = new File([new Uint8Array([0x00])], "evil.exe", {
            type: "application/x-msdownload",
        });
        const req = buildPostRequest(file);

        const res = await POST(req);
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toContain("Formato inválido");

        // ── A asserção central de Property 6: validação precede o storage.
        expect(mockedPutObject).not.toHaveBeenCalled();
        expect(mockedPrisma.media.create).not.toHaveBeenCalled();
    });

    it("tamanho > limite (imagem > 8 MB) → 400 e putObject NÃO é chamado", async () => {
        // 8 MB + 1 byte → ultrapassa IMAGE_MAX mas fica abaixo do teto
        // de Content-Length (200 MB + 1 KB), então cai no check de tamanho
        // por categoria, não no 413.
        const oversized = new Uint8Array(8 * 1024 * 1024 + 1);
        const file = new File([oversized], "big.jpg", { type: "image/jpeg" });
        const req = buildPostRequest(file);

        const res = await POST(req);
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body.error).toMatch(/muito grande/i);

        // ── Property 6: storage não é tocado.
        expect(mockedPutObject).not.toHaveBeenCalled();
        expect(mockedPrisma.media.create).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Static check — ausência de fs/promises e path no source (Requirement 2.7)
// ─────────────────────────────────────────────────────────────────────────────

describe("Static analysis — route.ts não importa fs/promises nem path (Requirement 2.7)", () => {
    it("não há imports de fs/promises ou path — toda escrita via Storage_Module", async () => {
        const routePath = join(
            process.cwd(),
            "src",
            "app",
            "api",
            "upload",
            "route.ts",
        );
        const source = await readFile(routePath, "utf-8");

        // Nenhuma forma de import dos módulos proibidos:
        //   - import ... from "fs" / "fs/promises" / "node:fs" / "node:fs/promises"
        //   - import ... from "path" / "node:path"
        //   - dynamic import("fs/promises") etc.
        expect(source).not.toMatch(/from\s+["'](?:node:)?fs(?:\/promises)?["']/);
        expect(source).not.toMatch(/from\s+["'](?:node:)?path["']/);
        expect(source).not.toMatch(/import\(\s*["'](?:node:)?fs(?:\/promises)?["']\s*\)/);
        expect(source).not.toMatch(/import\(\s*["'](?:node:)?path["']\s*\)/);

        // Sanity: as funções proibidas não aparecem como chamadas tampouco.
        expect(source).not.toMatch(/\bwriteFile\s*\(/);
        expect(source).not.toMatch(/\bmkdir\s*\(/);
    });
});

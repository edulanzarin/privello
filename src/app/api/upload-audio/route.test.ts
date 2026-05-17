/**
 * src/app/api/upload-audio/route.test.ts
 *
 * Tests do route handler `POST` / `DELETE /api/upload-audio` após o refactor
 * para `Storage_Module` (`src/lib/storage.ts`).
 *
 * Casos cobertos:
 *
 *   - **POST sucesso**: `putObject` é chamado com a Object_Key
 *     `audio/<profileId>/audio-<ts>.<ext>`; a URL retornada é persistida em
 *     `Profile.audioUrl` via `prisma.profile.update`; resposta `200
 *     { ok: true, url }` (Requirement 3.1, 3.3).
 *
 *   - **POST falha do `putObject`**: HTTP 500 com payload pt-BR
 *     `{ error: "Falha ao enviar áudio." }` e `console.warn` chamado uma vez
 *     com o shape estruturado `{ ts, endpoint, key, ownerId, contentType,
 *     size, error }` (Requirement 3.5).
 *
 *   - **DELETE**: chama `prisma.profile.updateMany({ data: { audioUrl: null } })`
 *     e **não** chama `deleteObject` (retenção permanente do objeto no R2 —
 *     Requirement 3.4, paridade com o comportamento histórico em disco).
 *
 * Estratégia de mock:
 *
 *   - `@/lib/storage` é mockado integralmente: `putObject` e `deleteObject`
 *     são `vi.fn()` para que possamos asserter chamadas/0-chamadas e
 *     controlar resoluções/rejeições por teste.
 *   - `@/lib/auth` exporta apenas `auth()` mockado, retornando uma sessão
 *     válida.
 *   - `@/lib/prisma` expõe um `prisma.profile` com `findUnique`, `update`,
 *     `updateMany` mockados.
 *
 * Cross-refs:
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` > Requirement 3
 *     (3.1, 3.3, 3.4, 3.5, 3.6).
 *   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
 *     Interfaces > 3. `src/app/api/upload-audio/route.ts`.
 *   - `.kiro/specs/migracao-infra-producao/tasks.md` > Task 3.4.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
            update: vi.fn(),
            updateMany: vi.fn(),
        },
    },
}));

// Imports após `vi.mock` para que as referências resolvam os módulos mockados.
import { POST, DELETE } from "./route";
import { putObject, deleteObject } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de mocks tipados
// ─────────────────────────────────────────────────────────────────────────────

const mockedPutObject = putObject as unknown as ReturnType<typeof vi.fn>;
const mockedDeleteObject = deleteObject as unknown as ReturnType<typeof vi.fn>;
const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedPrisma = prisma as unknown as {
    profile: {
        findUnique: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        updateMany: ReturnType<typeof vi.fn>;
    };
};

const TEST_USER_ID = "user-123";
const TEST_PROFILE_ID = "profile-abc";

/** Constrói um `NextRequest` POST com `FormData` contendo um File de áudio. */
function buildPostRequest(file: File, contentLength?: number): NextRequest {
    const fd = new FormData();
    fd.append("file", file);

    const headers = new Headers();
    if (contentLength !== undefined) {
        headers.set("content-length", String(contentLength));
    } else {
        headers.set("content-length", String(file.size));
    }

    return new NextRequest("http://localhost/api/upload-audio", {
        method: "POST",
        body: fd,
        headers,
    });
}

/** Constrói um `NextRequest` DELETE simples (sem body). */
function buildDeleteRequest(): NextRequest {
    return new NextRequest("http://localhost/api/upload-audio", {
        method: "DELETE",
    });
}

beforeEach(() => {
    mockedPutObject.mockReset();
    mockedDeleteObject.mockReset();
    mockedAuth.mockReset();
    mockedPrisma.profile.findUnique.mockReset();
    mockedPrisma.profile.update.mockReset();
    mockedPrisma.profile.updateMany.mockReset();

    // Sessão válida por default — testes individuais que precisam de
    // não-autenticado podem sobrescrever.
    mockedAuth.mockResolvedValue({ user: { id: TEST_USER_ID } });
    mockedPrisma.profile.findUnique.mockResolvedValue({ id: TEST_PROFILE_ID, userId: TEST_USER_ID });
    mockedPrisma.profile.update.mockResolvedValue({ id: TEST_PROFILE_ID });
    mockedPrisma.profile.updateMany.mockResolvedValue({ count: 1 });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — sucesso
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload-audio — sucesso (Requirement 3.1, 3.3)", () => {
    it("persiste a URL retornada por putObject em Profile.audioUrl e responde 200", async () => {
        const expectedUrl = "https://pub-test.r2.dev/audio/profile-abc/audio-123.mp3";
        mockedPutObject.mockResolvedValueOnce(expectedUrl);

        const file = new File([new Uint8Array([0x49, 0x44, 0x33])], "test-audio.mp3", {
            type: "audio/mpeg",
        });
        const req = buildPostRequest(file);

        const res = await POST(req);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toEqual({ ok: true, url: expectedUrl });

        // putObject foi chamado uma vez com a Object_Key esperada
        // (`audio/<profileId>/audio-<ts>.<ext>`).
        expect(mockedPutObject).toHaveBeenCalledTimes(1);
        const [key, buffer, contentType] = mockedPutObject.mock.calls[0] as [
            string,
            Buffer,
            string,
        ];
        expect(key).toMatch(/^audio\/profile-abc\/audio-\d+\.mp3$/);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(contentType).toBe("audio/mpeg");

        // URL persistida em Profile.audioUrl via prisma.profile.update.
        expect(mockedPrisma.profile.update).toHaveBeenCalledTimes(1);
        expect(mockedPrisma.profile.update).toHaveBeenCalledWith({
            where: { id: TEST_PROFILE_ID },
            data: { audioUrl: expectedUrl },
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — falha do putObject
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload-audio — falha do putObject (Requirement 3.5)", () => {
    it("retorna HTTP 500 com mensagem pt-BR e emite console.warn estruturado", async () => {
        const sdkErr = new Error("NetworkingError: connection refused");
        mockedPutObject.mockRejectedValueOnce(sdkErr);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
        // Silencia o console.info do caminho de sucesso (se houver).
        vi.spyOn(console, "info").mockImplementation(() => { });

        const file = new File([new Uint8Array([0xff, 0xfb, 0x90, 0x00])], "broken.mp3", {
            type: "audio/mpeg",
        });
        const req = buildPostRequest(file);

        const res = await POST(req);
        expect(res.status).toBe(500);

        const body = await res.json();
        expect(body).toEqual({ error: "Falha ao enviar áudio." });

        // putObject foi tentado (e rejeitou).
        expect(mockedPutObject).toHaveBeenCalledTimes(1);

        // Em falha, a URL NÃO é persistida.
        expect(mockedPrisma.profile.update).not.toHaveBeenCalled();

        // Log estruturado: shape exato esperado pelo design.
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const logged = warnSpy.mock.calls[0]?.[0] as Record<string, unknown>;
        expect(logged).toMatchObject({
            endpoint: "upload-audio",
            ownerId: TEST_PROFILE_ID,
            contentType: "audio/mpeg",
            size: file.size,
            error: sdkErr.message,
        });
        expect(typeof logged.ts).toBe("number");
        expect(typeof logged.key).toBe("string");
        expect(logged.key as string).toMatch(/^audio\/profile-abc\/audio-\d+\.mp3$/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — retenção permanente (Requirement 3.4)
// ─────────────────────────────────────────────────────────────────────────────

describe("DELETE /api/upload-audio — retenção permanente (Requirement 3.4)", () => {
    it("zera Profile.audioUrl via updateMany e NÃO chama deleteObject", async () => {
        const req = buildDeleteRequest();
        const res = await DELETE(req);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ ok: true });

        // updateMany foi chamado com `audioUrl: null` para o user atual.
        expect(mockedPrisma.profile.updateMany).toHaveBeenCalledTimes(1);
        expect(mockedPrisma.profile.updateMany).toHaveBeenCalledWith({
            where: { userId: TEST_USER_ID },
            data: { audioUrl: null },
        });

        // **Retenção permanente**: o objeto fica no bucket — `deleteObject`
        // jamais é chamado.
        expect(mockedDeleteObject).not.toHaveBeenCalled();
    });

    it("usuário não autenticado → 401 e sem efeitos colaterais (sanity)", async () => {
        mockedAuth.mockResolvedValueOnce(null);

        const req = buildDeleteRequest();
        const res = await DELETE(req);

        expect(res.status).toBe(401);
        expect(mockedPrisma.profile.updateMany).not.toHaveBeenCalled();
        expect(mockedDeleteObject).not.toHaveBeenCalled();
    });
});

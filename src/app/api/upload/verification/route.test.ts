// src/app/api/upload/verification/route.test.ts
//
// Unit tests do route handler `POST /api/upload/verification` (Task 3.6).
//
// Cobre os 3 cenários canônicos definidos no design:
//
//   1. **Sucesso**: `putObject` resolve com URL → handler retorna
//      `200 { ok: true, url }` (Requirement 4.5 — happy path).
//   2. **Falha do `putObject` + logger quebrado**: `console.warn` configurado
//      para lançar; o handler ainda retorna HTTP 500 com a mensagem pt-BR
//      `"Falha ao enviar documento."` sem propagar a exception do logger ao
//      cliente (Requirement 4.6).
//   3. **Validações inválidas não chamam `putObject`**: MIME ruim e arquivo
//      maior que o limite resultam em 400 sem invocar o `Storage_Module`
//      (Requirement 4.7 / NFR-SEC-4 — validação precede `putObject`).
//
// Estratégia de mock:
//
//   - `@/lib/storage` é mockado via `vi.mock` com `vi.hoisted` para que o
//     spy `putObject` exista antes do `import` do handler. Isolar o
//     `Storage_Module` mantém o teste sem rede e sem filesystem (não cai
//     em `Storage_Local_Fallback` mesmo que envs estejam ausentes).
//   - `@/lib/auth` retorna sessão fixa com `user.id = "user-1"`.
//   - `@/lib/prisma` mocka `profile.findUnique` retornando profile fixo
//     com `id = "profile-1"`.
//
// Cross-refs:
//   - `.kiro/specs/migracao-infra-producao/requirements.md` >
//     Requirement 4 (4.5, 4.6, 4.7).
//   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
//     Interfaces > 4.
//   - `.kiro/specs/migracao-infra-producao/tasks.md` > Task 3.6.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks compartilhados
// ─────────────────────────────────────────────────────────────────────────────

const storageMock = vi.hoisted(() => ({
    putObject: vi.fn<(key: string, body: Buffer | Uint8Array, contentType: string) => Promise<string>>(),
}));

vi.mock("@/lib/storage", () => ({
    putObject: storageMock.putObject,
}));

const authMock = vi.hoisted(() => ({
    auth: vi.fn(async () => ({ user: { id: "user-1" } })),
}));

vi.mock("@/lib/auth", () => ({
    auth: authMock.auth,
}));

const prismaMock = vi.hoisted(() => ({
    profile: {
        findUnique: vi.fn(async () => ({ id: "profile-1", userId: "user-1" })),
    },
}));

vi.mock("@/lib/prisma", () => ({
    prisma: prismaMock,
}));

// Import só depois dos `vi.mock` para que o handler resolva os módulos
// mockados.
import { POST } from "@/app/api/upload/verification/route";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constrói uma `NextRequest`-compatible com `multipart/form-data` carregando
 * um único `File`. `req.formData()` em Next.js 16 usa o parser Web padrão.
 */
function buildRequestWithFile(file: File): Request {
    const fd = new FormData();
    fd.append("file", file);
    return new Request("http://localhost/api/upload/verification", {
        method: "POST",
        body: fd,
    });
}

beforeEach(() => {
    storageMock.putObject.mockReset();
    authMock.auth.mockReset();
    authMock.auth.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.profile.findUnique.mockReset();
    prismaMock.profile.findUnique.mockResolvedValue({ id: "profile-1", userId: "user-1" });
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Suites
// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/upload/verification — sucesso (Requirement 4.5)", () => {
    it("putObject resolve com URL → 200 { ok: true, url }", async () => {
        const fakeUrl = "https://pub-test.r2.dev/verification/profile-1/123-abc.jpg";
        storageMock.putObject.mockResolvedValueOnce(fakeUrl);

        const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "doc.jpg", {
            type: "image/jpeg",
        });
        const res = await POST(buildRequestWithFile(file) as never);

        expect(res.status).toBe(200);
        const body = (await res.json()) as { ok: boolean; url: string };
        expect(body).toEqual({ ok: true, url: fakeUrl });

        // putObject chamado exatamente 1x com Object_Key no formato canônico
        // `verification/<profileId>/<timestamp>-<rand>.<ext>` e ContentType
        // preservado.
        expect(storageMock.putObject).toHaveBeenCalledTimes(1);
        const [key, body2, contentType] = storageMock.putObject.mock.calls[0]!;
        expect(key).toMatch(/^verification\/profile-1\/\d+-[a-z0-9]+\.jpg$/);
        expect(body2).toBeInstanceOf(Buffer);
        expect(contentType).toBe("image/jpeg");
    });
});

describe("POST /api/upload/verification — falha + logger quebrado (Requirement 4.6)", () => {
    it("putObject rejeita e console.warn lança → handler ainda retorna 500", async () => {
        storageMock.putObject.mockRejectedValueOnce(new Error("R2 unreachable"));

        // Logger configurado para lançar — simula stdout indisponível.
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {
                throw new Error("logger broken");
            });
        // `console.info` é chamado no caminho de sucesso; aqui o handler
        // entra no caminho de erro e não deve emitir info — silenciamos
        // por defesa para que erros futuros não poluam stdout dos testes.
        const infoSpy = vi.spyOn(console, "info").mockImplementation(() => { });

        const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "doc.jpg", {
            type: "image/jpeg",
        });

        // O handler NÃO deve propagar a exception do logger — promise resolve
        // (não rejeita) com Response 500.
        const res = await POST(buildRequestWithFile(file) as never);

        expect(res.status).toBe(500);
        const body = (await res.json()) as { error: string };
        expect(body).toEqual({ error: "Falha ao enviar documento." });

        // Sanity: o logger broken foi efetivamente invocado (caminho exercitado).
        expect(warnSpy).toHaveBeenCalledTimes(1);
        // Caminho de sucesso não foi atingido (nenhum info emitido).
        expect(infoSpy).not.toHaveBeenCalled();
    });
});

describe("POST /api/upload/verification — validações inválidas não chamam putObject (Requirement 4.7)", () => {
    it("MIME inválido → 400 e putObject não é chamado", async () => {
        const file = new File([new Uint8Array([0])], "doc.txt", {
            type: "text/plain",
        });
        const res = await POST(buildRequestWithFile(file) as never);

        expect(res.status).toBe(400);
        expect(storageMock.putObject).not.toHaveBeenCalled();
    });

    it("imagem > 10 MB → 400 e putObject não é chamado", async () => {
        // 10 MB + 1 byte: estoura `MAX_SIZE_IMG` (10 * 1024 * 1024). Cobre a
        // mesma branch que a checagem de vídeo > 150 MB; não duplicamos a
        // alocação massiva do vídeo aqui pois a lógica de validação é
        // idêntica (`isImage/isVideo && file.size > LIMIT`).
        const oversizedImage = new Uint8Array(10 * 1024 * 1024 + 1);
        const file = new File([oversizedImage], "big.jpg", {
            type: "image/jpeg",
        });
        const res = await POST(buildRequestWithFile(file) as never);

        expect(res.status).toBe(400);
        expect(storageMock.putObject).not.toHaveBeenCalled();
    });
});

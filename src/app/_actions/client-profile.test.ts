/**
 * src/app/_actions/client-profile.test.ts
 *
 * Unit tests de `uploadClientAvatarAction` (`src/app/_actions/client-profile.ts`)
 * — Task 3.10 do spec `migracao-infra-producao`.
 *
 * Cobertura:
 *
 *   - **Sucesso (Requirement 6.3)**: `putObject` retorna URL → `prisma.user.update`
 *     é chamado com `{ where: { id: userId }, data: { image: url } }` → action
 *     retorna `{ ok: true, url }`.
 *
 *   - **Falha do `putObject` (Requirement 6.4)**: SDK/fallback lança exception
 *     arbitrária → action retorna `{ error: "Falha ao enviar avatar." }` sem
 *     propagar; `console.warn` recebe payload estruturado com `endpoint`,
 *     `key`, `ownerId`, `contentType`, `size`, `error`.
 *
 *   - **Validações precedem `putObject` (Requirement 6.2)**:
 *       - MIME inválido (`application/pdf`) → action devolve erro pt-BR e
 *         `putObject` não é chamado.
 *       - Tamanho > 5 MB → action devolve erro pt-BR e `putObject` não é
 *         chamado.
 *       - Arquivo vazio → mesma garantia.
 *
 * Estratégia de mock:
 *
 *   - `@/lib/storage`: `putObject` é um `vi.fn()` controlado por teste.
 *   - `@/lib/auth`: `auth()` devolve uma sessão fake com `user.id`. Permite
 *     também simular ausência de sessão em casos negativos (não cobertos
 *     por esta task — ver `Requirement 6.2` que exige só auth ok + falha de
 *     validação).
 *   - `@/lib/prisma`: `user.update` é `vi.fn()`.
 *
 * Cross-refs:
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` >
 *     Requirement 6 (6.2, 6.3, 6.4).
 *   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
 *     Interfaces > 6.
 *   - `.kiro/specs/migracao-infra-producao/tasks.md` > Task 3.10.
 *   - `src/app/_actions/client-profile.ts` (`uploadClientAvatarAction`).
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks compartilhados — declarados via `vi.hoisted` para que o estado
// inicialize antes do `vi.mock` factory ser invocado pelo Vitest.
// ─────────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
    putObject: vi.fn(),
    auth: vi.fn(),
    userUpdate: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
    putObject: mocks.putObject,
}));

vi.mock("@/lib/auth", () => ({
    auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: { update: mocks.userUpdate },
    },
}));

// Import após os `vi.mock` para que o módulo sob teste resolva os mocks.
import { uploadClientAvatarAction } from "./client-profile";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USER_ID = "user-cuid-123";

/** Sessão NextAuth fake mínima para passar pela checagem `session?.user?.id`. */
function fakeSession() {
    return { user: { id: TEST_USER_ID } };
}

/**
 * Cria um `File` em memória com tamanho `sizeBytes` e MIME `type`. Em Node
 * 20+ o `File` global está disponível via `node:buffer` — Vitest expõe via
 * environment "node".
 */
function makeFile(opts: {
    name?: string;
    type: string;
    sizeBytes: number;
    fillByte?: number;
}): File {
    const { name = "avatar.bin", type, sizeBytes, fillByte = 0xab } = opts;
    const bytes = new Uint8Array(sizeBytes).fill(fillByte);
    return new File([bytes], name, { type });
}

/** Embrulha um `File` num `FormData` no campo `avatar`. */
function makeFormData(file: File): FormData {
    const fd = new FormData();
    fd.append("avatar", file);
    return fd;
}

beforeEach(() => {
    mocks.putObject.mockReset();
    mocks.auth.mockReset();
    mocks.userUpdate.mockReset();
    mocks.auth.mockResolvedValue(fakeSession());
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Sucesso (Requirement 6.3)
// ─────────────────────────────────────────────────────────────────────────────

describe("uploadClientAvatarAction — sucesso", () => {
    it("persiste a URL retornada por putObject em User.image e devolve { ok: true, url }", async () => {
        const fakeUrl = "https://pub-test.r2.dev/uploads/user-cuid-123/123.jpg";
        mocks.putObject.mockResolvedValueOnce(fakeUrl);
        mocks.userUpdate.mockResolvedValueOnce({ id: TEST_USER_ID, image: fakeUrl });

        const file = makeFile({
            name: "avatar.jpg",
            type: "image/jpeg",
            sizeBytes: 1024,
        });
        const result = await uploadClientAvatarAction(makeFormData(file));

        expect(result).toEqual({ ok: true, url: fakeUrl });

        // putObject foi chamado uma vez com a chave canônica `uploads/<userId>/...`
        // e contentType correto.
        expect(mocks.putObject).toHaveBeenCalledTimes(1);
        const [keyArg, bodyArg, contentTypeArg] = mocks.putObject.mock.calls[0];
        expect(keyArg).toMatch(
            /^uploads\/user-cuid-123\/\d+-[a-z0-9]+\.jpg$/,
        );
        expect(Buffer.isBuffer(bodyArg)).toBe(true);
        expect((bodyArg as Buffer).byteLength).toBe(1024);
        expect(contentTypeArg).toBe("image/jpeg");

        // prisma.user.update chamado exatamente com `{ where: { id }, data: { image: url } }`.
        expect(mocks.userUpdate).toHaveBeenCalledTimes(1);
        expect(mocks.userUpdate).toHaveBeenCalledWith({
            where: { id: TEST_USER_ID },
            data: { image: fakeUrl },
        });
    });

    it("mapeia image/png e image/webp para extensões corretas na Object_Key", async () => {
        mocks.putObject.mockResolvedValue("https://pub.test/x");
        mocks.userUpdate.mockResolvedValue({});

        await uploadClientAvatarAction(
            makeFormData(makeFile({ name: "p.png", type: "image/png", sizeBytes: 32 })),
        );
        await uploadClientAvatarAction(
            makeFormData(makeFile({ name: "p.webp", type: "image/webp", sizeBytes: 32 })),
        );

        expect(mocks.putObject).toHaveBeenCalledTimes(2);
        const [pngKey] = mocks.putObject.mock.calls[0];
        const [webpKey] = mocks.putObject.mock.calls[1];
        expect(pngKey).toMatch(/\.png$/);
        expect(webpKey).toMatch(/\.webp$/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Falha do `putObject` (Requirement 6.4)
// ─────────────────────────────────────────────────────────────────────────────

describe("uploadClientAvatarAction — falha do putObject", () => {
    it("traduz qualquer exception em { error: 'Falha ao enviar avatar.' } sem propagar", async () => {
        const sentinel = new Error("R2 indisponível: NetworkingError");
        mocks.putObject.mockRejectedValueOnce(sentinel);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

        const file = makeFile({
            name: "avatar.jpg",
            type: "image/jpeg",
            sizeBytes: 2048,
        });
        const result = await uploadClientAvatarAction(makeFormData(file));

        expect(result).toEqual({ error: "Falha ao enviar avatar." });

        // user.update NÃO é chamado quando putObject falha.
        expect(mocks.userUpdate).not.toHaveBeenCalled();

        // console.warn recebeu o payload estruturado padronizado pelo design.
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const [payload] = warnSpy.mock.calls[0];
        expect(payload).toMatchObject({
            endpoint: "upload-client-avatar",
            ownerId: TEST_USER_ID,
            contentType: "image/jpeg",
            size: 2048,
            error: "R2 indisponível: NetworkingError",
        });
        // `key` precisa estar presente e seguir o padrão canônico.
        expect((payload as { key: string }).key).toMatch(
            /^uploads\/user-cuid-123\/\d+-[a-z0-9]+\.jpg$/,
        );
        // `ts` é um timestamp numérico.
        expect(typeof (payload as { ts: number }).ts).toBe("number");
    });

    it("absorve falha do prisma.user.update (não-S3) com a mesma mensagem pt-BR", async () => {
        // Cobre o ramo do try/catch único onde a exception vem do DB, não
        // do storage — o JSDoc do action explicita que isso também devolve
        // a mensagem genérica (Requirement 6.4).
        mocks.putObject.mockResolvedValueOnce("https://pub.test/uploads/x.jpg");
        mocks.userUpdate.mockRejectedValueOnce(new Error("P1001: connection refused"));
        vi.spyOn(console, "warn").mockImplementation(() => { });

        const result = await uploadClientAvatarAction(
            makeFormData(makeFile({ type: "image/jpeg", sizeBytes: 64 })),
        );

        expect(result).toEqual({ error: "Falha ao enviar avatar." });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validações precedem `putObject` (Requirement 6.2)
// ─────────────────────────────────────────────────────────────────────────────

describe("uploadClientAvatarAction — validações inválidas não chamam putObject", () => {
    it("MIME não permitido (application/pdf) → erro pt-BR e putObject NÃO chamado", async () => {
        const file = makeFile({
            name: "doc.pdf",
            type: "application/pdf",
            sizeBytes: 1024,
        });

        const result = await uploadClientAvatarAction(makeFormData(file));

        expect(result).toEqual({ error: "Formato inválido. Use JPG, PNG ou WebP." });
        expect(mocks.putObject).not.toHaveBeenCalled();
        expect(mocks.userUpdate).not.toHaveBeenCalled();
    });

    it("tamanho > 5 MB → erro pt-BR e putObject NÃO chamado", async () => {
        const oversized = makeFile({
            name: "huge.jpg",
            type: "image/jpeg",
            sizeBytes: 5 * 1024 * 1024 + 1, // 1 byte acima do teto
        });

        const result = await uploadClientAvatarAction(makeFormData(oversized));

        expect(result).toEqual({ error: "A foto deve ter no máximo 5MB." });
        expect(mocks.putObject).not.toHaveBeenCalled();
        expect(mocks.userUpdate).not.toHaveBeenCalled();
    });

    it("arquivo vazio (size 0) → erro pt-BR e putObject NÃO chamado", async () => {
        const empty = makeFile({
            name: "empty.jpg",
            type: "image/jpeg",
            sizeBytes: 0,
        });

        const result = await uploadClientAvatarAction(makeFormData(empty));

        expect(result).toEqual({ error: "Selecione uma foto." });
        expect(mocks.putObject).not.toHaveBeenCalled();
        expect(mocks.userUpdate).not.toHaveBeenCalled();
    });

    it("sem sessão (auth() devolve null) → erro pt-BR e putObject NÃO chamado", async () => {
        mocks.auth.mockResolvedValueOnce(null);

        const result = await uploadClientAvatarAction(
            makeFormData(makeFile({ type: "image/jpeg", sizeBytes: 32 })),
        );

        expect(result).toEqual({ error: "Não autorizado." });
        expect(mocks.putObject).not.toHaveBeenCalled();
        expect(mocks.userUpdate).not.toHaveBeenCalled();
    });

    it("schema Zod falha (campo `avatar` ausente) → erro de validação e putObject NÃO chamado", async () => {
        const fd = new FormData();
        // Não anexamos `avatar` propositalmente.

        const result = (await uploadClientAvatarAction(fd)) as {
            error: string;
            issues?: unknown;
        };

        expect(result.error).toBe("Validation failed");
        expect(result.issues).toBeDefined();
        expect(mocks.putObject).not.toHaveBeenCalled();
        expect(mocks.userUpdate).not.toHaveBeenCalled();
    });
});

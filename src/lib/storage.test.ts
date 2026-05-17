/**
 * src/lib/storage.test.ts
 *
 * Unit tests do `Storage_Module` (`src/lib/storage.ts`) — examples e modos
 * de erro complementares aos property tests em `src/lib/storage.pbt.ts`.
 *
 * Esta task cobre os caminhos exatos que precisam de assert determinístico
 * sobre o cliente S3 do AWS SDK v3 (mockado via `vi.mock`), em vez de
 * propriedades estatísticas:
 *
 *   - Erros do SDK propagam **intactos**, sem wrapping (NFR-OBS-3 +
 *     Requirement 1.8).
 *   - `deleteObject` chama `DeleteObjectCommand` em modo R2 e é no-op
 *     silencioso em `Storage_Local_Fallback` (Requirement 1.2 + 1.5).
 *   - `S3Client` é instanciado com `region: "auto"` e endpoint canônico
 *     `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` (NFR-SEC-3 +
 *     Requirement 1.3).
 *   - O módulo **não emite log algum** próprio: nenhum `console.warn` /
 *     `info` / `error` / `log` é chamado pelo `Storage_Module`, garantindo
 *     que credenciais (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) jamais
 *     são vazadas via stdout/stderr (NFR-OBS-2).
 *   - **Não há retry automático em falha** — uma rejeição do `send` causa
 *     `putObject` a rejeitar imediatamente, com `S3Client.send` chamado
 *     exatamente 1× (NFR-DUR-2).
 *
 * Estratégia de mock:
 *
 *   - `@aws-sdk/client-s3` é mockado por inteiro via `vi.mock` + `vi.hoisted`
 *     para que o estado compartilhado (`send`, `constructorCalls`,
 *     `putCommands`, `deleteCommands`) seja inicializado antes do `import`
 *     de `@/lib/storage`. As classes `S3Client`, `PutObjectCommand`,
 *     `DeleteObjectCommand` viram stubs que apenas capturam os argumentos
 *     do constructor e delegam `send` ao spy `sdkMock.send`.
 *
 *   - Envvars são manipuladas via `vi.stubEnv` em `beforeEach` e restauradas
 *     em `afterEach` com `vi.unstubAllEnvs`, evitando contaminação entre
 *     casos. Como o `Storage_Module` lê `process.env` por chamada (e
 *     constrói o `S3Client` por chamada), nenhum reset adicional é
 *     necessário.
 *
 * Cross-refs:
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` >
 *     Requirement 1 (1.2, 1.3, 1.8, 1.9), §5 NFR-DUR-2, NFR-OBS-2,
 *     NFR-OBS-3, NFR-SEC-3.
 *   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
 *     Interfaces > 1. `src/lib/storage.ts`.
 *   - `.kiro/specs/migracao-infra-producao/tasks.md` > Task 1.7.
 */

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mock compartilhado do `@aws-sdk/client-s3`
// ─────────────────────────────────────────────────────────────────────────────

const sdkMock = vi.hoisted(() => ({
    /** Spy do `S3Client.prototype.send`; configurado por teste. */
    send: vi.fn(),
    /** Args capturados de cada `new S3Client(args)`. */
    constructorCalls: [] as unknown[],
    /** Inputs capturados de cada `new PutObjectCommand(input)`. */
    putCommands: [] as unknown[],
    /** Inputs capturados de cada `new DeleteObjectCommand(input)`. */
    deleteCommands: [] as unknown[],
}));

vi.mock("@aws-sdk/client-s3", () => {
    class S3Client {
        constructor(args: unknown) {
            sdkMock.constructorCalls.push(args);
        }
        send(command: unknown) {
            return sdkMock.send(command);
        }
    }
    class PutObjectCommand {
        input: unknown;
        constructor(input: unknown) {
            this.input = input;
            sdkMock.putCommands.push(input);
        }
    }
    class DeleteObjectCommand {
        input: unknown;
        constructor(input: unknown) {
            this.input = input;
            sdkMock.deleteCommands.push(input);
        }
    }
    return { S3Client, PutObjectCommand, DeleteObjectCommand };
});

// Import só depois do `vi.mock` para que o `Storage_Module` resolva o módulo
// mockado.
import { deleteObject, putObject } from "@/lib/storage";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de envvar
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ACCOUNT_ID = "abc123def456";
const TEST_ACCESS_KEY = "AKIA_R2_TEST_KEY";
const TEST_SECRET_KEY = "r2-secret-test-value";
const TEST_BUCKET = "privello-test-bucket";
const TEST_PUBLIC_URL = "https://pub-test.r2.dev";

/** Configura envs como se estivéssemos em produção com R2 ativo. */
function setProductionR2Env(): void {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("R2_ACCOUNT_ID", TEST_ACCOUNT_ID);
    vi.stubEnv("R2_ACCESS_KEY_ID", TEST_ACCESS_KEY);
    vi.stubEnv("R2_SECRET_ACCESS_KEY", TEST_SECRET_KEY);
    vi.stubEnv("R2_BUCKET_NAME", TEST_BUCKET);
    vi.stubEnv("R2_PUBLIC_URL", TEST_PUBLIC_URL);
}

/** Limpa as 5 envs R2 (vazia → falsy → ausente para `isLocalFallbackMode`). */
function clearAllR2Env(): void {
    vi.stubEnv("R2_ACCOUNT_ID", "");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("R2_BUCKET_NAME", "");
    vi.stubEnv("R2_PUBLIC_URL", "");
}

beforeEach(() => {
    sdkMock.send.mockReset();
    sdkMock.constructorCalls.length = 0;
    sdkMock.putCommands.length = 0;
    sdkMock.deleteCommands.length = 0;
    // Limpa envs herdadas de CI/`.env` real.
    clearAllR2Env();
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Suites
// ─────────────────────────────────────────────────────────────────────────────

describe("Storage_Module / putObject — propagação de erros do SDK", () => {
    it("propaga erro NoSuchBucket sem wrapping (NFR-OBS-3 / Requirement 1.8)", async () => {
        setProductionR2Env();
        const err = Object.assign(new Error("The specified bucket does not exist"), {
            name: "NoSuchBucket",
        });
        sdkMock.send.mockRejectedValueOnce(err);

        const promise = putObject(
            "uploads/profile-id/file.jpg",
            Buffer.from([1, 2, 3]),
            "image/jpeg",
        );

        // `toBe` verifica identidade de referência: a mesma instância de Error
        // recebida pelo módulo deve ser exatamente a que ele lança.
        await expect(promise).rejects.toBe(err);
        expect(sdkMock.send).toHaveBeenCalledTimes(1);
    });

    it("propaga erro AccessDenied sem wrapping (NFR-OBS-3 / Requirement 1.8)", async () => {
        setProductionR2Env();
        const err = Object.assign(new Error("Access Denied"), {
            name: "AccessDenied",
        });
        sdkMock.send.mockRejectedValueOnce(err);

        await expect(
            putObject("uploads/x/y.png", Buffer.from([0]), "image/png"),
        ).rejects.toBe(err);
    });
});

describe("Storage_Module / deleteObject — modos R2 e fallback (Requirement 1.2 / 1.5)", () => {
    it("em modo R2: chama DeleteObjectCommand com Bucket e Key corretos", async () => {
        setProductionR2Env();
        sdkMock.send.mockResolvedValueOnce({});

        await deleteObject("uploads/profile-id/file.jpg");

        expect(sdkMock.send).toHaveBeenCalledTimes(1);
        expect(sdkMock.deleteCommands).toHaveLength(1);
        expect(sdkMock.deleteCommands[0]).toMatchObject({
            Bucket: TEST_BUCKET,
            Key: "uploads/profile-id/file.jpg",
        });
        // Garantir que nenhum PutObjectCommand foi emitido por engano.
        expect(sdkMock.putCommands).toHaveLength(0);
    });

    it("em Storage_Local_Fallback: é no-op silencioso (não toca o SDK)", async () => {
        vi.stubEnv("NODE_ENV", "development");
        // R2 envs todas vazias (set em `beforeEach` via `clearAllR2Env`).

        await expect(
            deleteObject("uploads/anything/here.bin"),
        ).resolves.toBeUndefined();

        expect(sdkMock.send).not.toHaveBeenCalled();
        expect(sdkMock.constructorCalls).toHaveLength(0);
        expect(sdkMock.deleteCommands).toHaveLength(0);
    });
});

describe("Storage_Module / construção do S3Client (NFR-SEC-3 / Requirement 1.3)", () => {
    it('instancia S3Client com region "auto" e endpoint canônico R2', async () => {
        setProductionR2Env();
        sdkMock.send.mockResolvedValueOnce({});

        const url = await putObject(
            "uploads/p/f.bin",
            Buffer.from([1]),
            "application/octet-stream",
        );

        expect(sdkMock.constructorCalls).toHaveLength(1);
        expect(sdkMock.constructorCalls[0]).toEqual({
            region: "auto",
            endpoint: `https://${TEST_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: TEST_ACCESS_KEY,
                secretAccessKey: TEST_SECRET_KEY,
            },
        });

        // Sanity: PutObjectCommand foi emitido com Bucket/Key/ContentType
        // esperados, e a URL composta corresponde a R2_PUBLIC_URL + key.
        expect(sdkMock.putCommands[0]).toMatchObject({
            Bucket: TEST_BUCKET,
            Key: "uploads/p/f.bin",
            ContentType: "application/octet-stream",
        });
        expect(url).toBe(`${TEST_PUBLIC_URL}/uploads/p/f.bin`);
    });
});

describe("Storage_Module / sem vazamento de credenciais em logs (NFR-OBS-2)", () => {
    it("não emite console.warn / info / error / log em sucesso nem em falha", async () => {
        setProductionR2Env();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => { });
        const info = vi.spyOn(console, "info").mockImplementation(() => { });
        const error = vi.spyOn(console, "error").mockImplementation(() => { });
        const log = vi.spyOn(console, "log").mockImplementation(() => { });

        // Caminho de sucesso.
        sdkMock.send.mockResolvedValueOnce({});
        await putObject(
            "uploads/p/file.jpg",
            Buffer.from([0xff]),
            "image/jpeg",
        );

        // Caminho de falha — o módulo deve continuar silencioso (callers logam).
        const sentinel = new Error("NetworkingError");
        sdkMock.send.mockRejectedValueOnce(sentinel);
        await expect(
            putObject(
                "uploads/p/file2.jpg",
                Buffer.from([0xff]),
                "image/jpeg",
            ),
        ).rejects.toBe(sentinel);

        for (const spy of [warn, info, error, log]) {
            expect(spy).not.toHaveBeenCalled();
        }

        // Defesa em profundidade: mesmo se algum log futuro for adicionado,
        // ele jamais pode conter as credenciais. Como `not.toHaveBeenCalled`
        // já garante zero chamadas, a serialização abaixo é uma checagem
        // defensiva que falha cedo se o invariante quebrar no futuro.
        const allCalls = [
            ...warn.mock.calls,
            ...info.mock.calls,
            ...error.mock.calls,
            ...log.mock.calls,
        ];
        const serialized = JSON.stringify(allCalls);
        expect(serialized).not.toContain(TEST_ACCESS_KEY);
        expect(serialized).not.toContain(TEST_SECRET_KEY);
    });
});

describe("Storage_Module / sem retry automático (NFR-DUR-2)", () => {
    it("uma rejeição do send → putObject rejeita; send é chamado exatamente 1×", async () => {
        setProductionR2Env();
        const err = new Error("transient network error");
        sdkMock.send.mockRejectedValueOnce(err);

        await expect(
            putObject("uploads/x/y.png", Buffer.from([1]), "image/png"),
        ).rejects.toBe(err);

        expect(sdkMock.send).toHaveBeenCalledTimes(1);
    });
});

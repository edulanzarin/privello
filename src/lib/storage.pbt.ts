// src/lib/storage.pbt.ts
//
// Property tests do `Storage_Module` — `src/lib/storage.ts`.
//
// Este arquivo é o ponto canônico de cobertura PBT do módulo. As Properties
// 3 e 4 (Tasks 1.5, 1.6) serão adicionadas como `describe` blocks adjacentes
// para coexistir limpamente. Ver
// `.kiro/specs/migracao-infra-producao/design.md > Correctness Properties`
// para a definição formal de cada Property.
//
// Cobertura PBT por Property:
//   - Property 1 (joinPublicUrl idempotente)              — Task 1.3
//   - Property 2 (erro descritivo em produção)            — Task 1.4
//   - Property 3 (Storage_Local_Fallback ativação)        — Task 1.5
//   - Property 4 (fallback round-trip + idempotência S3)  — Task 1.6 (TODO)
//
// Property 1 é função pura sobre strings — sem rede, sem banco, sem clock.
// Property 2 mocka `@aws-sdk/client-s3` defensivamente (o caminho de erro
// validado nunca toca o SDK, pois `assertProductionEnvOrThrow` falha antes
// do `buildS3Client`); o mock garante isolamento total da rede mesmo em
// caso de regressão na ordem das verificações.
//
// Default global `numRuns: 100` herdado de `vitest.setup.ts`.

import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    vi,
} from "vitest";
import { test, fc } from "@fast-check/vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Mock do `@aws-sdk/client-s3`. `vi.mock` é hoisted pelo vitest e roda
// antes do `import` abaixo, garantindo que `@/lib/storage` resolva o stub
// em vez do módulo real. Os comandos viram capturadores triviais e
// `S3Client.send` retorna `Promise.resolve({})` por default — Property 1
// não toca o SDK e Property 2 falha em `assertProductionEnvOrThrow` antes
// de qualquer init de cliente.
vi.mock("@aws-sdk/client-s3", () => {
    class S3Client {
        constructor(_args: unknown) { }
        send(_command: unknown) {
            return Promise.resolve({});
        }
    }
    class PutObjectCommand {
        input: unknown;
        constructor(input: unknown) {
            this.input = input;
        }
    }
    class DeleteObjectCommand {
        input: unknown;
        constructor(input: unknown) {
            this.input = input;
        }
    }
    return { S3Client, PutObjectCommand, DeleteObjectCommand };
});

import { isLocalFallbackMode, joinPublicUrl, putObject } from "@/lib/storage";

// ─────────────────────────────────────────────────────────────────────────────
// Geradores compartilhados — Property 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * URLs HTTPS bem-formadas, sem query/fragment para isolar o teste à parte
 * path do output. `validSchemes: ["https"]` garante que `new URL(raw)` parsa
 * com `protocol === "https:"` (mais sólido que filtrar por
 * `startsWith("https://")` — mesmo padrão de `r2-hostname.pbt.ts`).
 *
 * Filtro adicional: descarta URLs que já contêm `//` fora do esquema (raras
 * em saída do `fc.webUrl`, mas possíveis dependendo da geração de path).
 * Sem o filtro, a invariante (b) — "sem `//` exceto no `://`" — falharia
 * por culpa do gerador, não do `joinPublicUrl`.
 */
const httpsBase = fc
    .webUrl({
        validSchemes: ["https"],
        withQueryParameters: false,
        withFragments: false,
    })
    .filter((u) => !u.replace(/^https:\/\//, "").includes("//"));

/**
 * Keys arbitrárias para sub-paths. Filtros:
 *   - `!s.includes("\0")` — null bytes não fazem sentido em Object_Keys e
 *     desestabilizam comparações de string.
 *   - `!s.includes("//")` — keys que já contêm `//` no meio violariam a
 *     invariante (b) por construção, fora do escopo desta Property.
 *
 * Tamanho 1..80 cobre keys curtas (`uploads/x/y.jpg`) e longas
 * (timestamps + nonces concatenados).
 */
const keyBody = fc
    .string({ minLength: 1, maxLength: 80 })
    .filter((s) => !s.includes("\0") && !s.includes("//"));

// ─────────────────────────────────────────────────────────────────────────────
// Property 1
// ─────────────────────────────────────────────────────────────────────────────

describe("Storage_Module — Property 1: joinPublicUrl é composição idempotente sem barra duplicada", () => {
    // Feature: migracao-infra-producao, Property 1: joinPublicUrl é composição idempotente sem barra duplicada
    // Validates: Requirements 1.6, NFR-RB-3
    test.prop([
        httpsBase,
        fc.integer({ min: 0, max: 5 }),
        keyBody,
        fc.integer({ min: 0, max: 5 }),
    ])(
        "composição é idempotente sob trimming e produz exatamente um separador",
        (base, extraTrailingSlashes, key, extraLeadingSlashes) => {
            const baseWithSlashes = base + "/".repeat(extraTrailingSlashes);
            const keyWithSlashes = "/".repeat(extraLeadingSlashes) + key;
            const out = joinPublicUrl(baseWithSlashes, keyWithSlashes);

            // (a) Começa com `base` trimado (sem barras finais). Como `base`
            //     já vem do gerador `httpsBase` sem trailing slashes
            //     introduzidas no path, `base.replace(/\/+$/, "")` é a forma
            //     canônica do tronco.
            const trimmedBase = base.replace(/\/+$/, "");
            expect(out.startsWith(trimmedBase)).toBe(true);

            // (b) Sem `//` exceto na sequência `://` do esquema HTTPS.
            const withoutScheme = out.replace(/^https:\/\//, "");
            expect(withoutScheme.includes("//")).toBe(false);

            // (c) Idempotente sob trimming: pré-normalizar base e key produz
            //     o mesmo output que passar as versões com barras extras.
            const trimmedKey = key.replace(/^\/+/, "");
            expect(out).toBe(joinPublicUrl(trimmedBase, trimmedKey));
        },
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Geradores compartilhados — Property 2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nomes canônicos das três envvars obrigatórias em produção. A ordem aqui
 * NÃO é semântica para a Property — a mensagem do `Storage_Module` lista
 * apenas as ausentes na ordem em que são checadas em `assertProductionEnvOrThrow`,
 * mas a Property só asserta "contém todos os ausentes / nenhum dos presentes",
 * sem amarrar à ordem.
 */
const REQUIRED_ENV_NAMES = [
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
] as const;

type RequiredEnvName = (typeof REQUIRED_ENV_NAMES)[number];

/**
 * Subconjunto não-vazio dos 3 nomes de envvar — representa quais estão
 * AUSENTES no run. `fc.subarray` gera todos os 2^3 - 1 = 7 subsets
 * não-vazios; o `filter` descarta o array vazio (caso em que não haveria
 * erro a validar).
 */
const missingSubset = fc
    .subarray([...REQUIRED_ENV_NAMES])
    .filter((arr) => arr.length > 0);

// ─────────────────────────────────────────────────────────────────────────────
// Property 2
// ─────────────────────────────────────────────────────────────────────────────

describe("Storage_Module — Property 2: erro descritivo em produção sem credenciais", () => {
    // Resetar `process.env` entre runs evita contaminação entre exemplos do
    // fast-check. `vi.stubEnv` é o caminho oficial do vitest para mutar
    // `process.env`; `vi.unstubAllEnvs()` restaura tudo de uma vez.
    beforeEach(() => {
        vi.unstubAllEnvs();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    // Feature: migracao-infra-producao, Property 2: erro descritivo em produção sem credenciais
    // Validates: Requirements 1.4, 1.4.1
    test.prop([missingSubset])(
        "putObject lança Error cuja mensagem contém os nomes ausentes e nenhum dos presentes",
        async (missing) => {
            // Setup do ambiente sintético:
            //   - NODE_ENV = "production" para acionar o ramo de validação.
            //   - Para cada envvar PRESENTE (não em `missing`): stub com um
            //     placeholder válido não-vazio.
            //   - Para cada envvar AUSENTE (em `missing`): stub com `""`,
            //     que `assertProductionEnvOrThrow` trata como ausente
            //     (`!env.NAME` é true para string vazia).
            //   - `R2_ACCOUNT_ID` e `R2_PUBLIC_URL` não participam da
            //     validação (Requirement 1.5 + design notas) — irrelevantes
            //     aqui; deixados unstubbed.
            vi.stubEnv("NODE_ENV", "production");
            const present: RequiredEnvName[] = REQUIRED_ENV_NAMES.filter(
                (name) => !missing.includes(name),
            );
            for (const name of REQUIRED_ENV_NAMES) {
                if (missing.includes(name)) {
                    vi.stubEnv(name, "");
                } else {
                    // Placeholder válido distinto por nome, para que a
                    // assertion "nenhum dos presentes aparece na mensagem"
                    // tenha conteúdo a verificar (a mensagem do módulo só
                    // cita NOMES de envvar, não valores — esta é a
                    // garantia anti-vazamento de credenciais reforçada por
                    // NFR-OBS-2 / Property 2).
                    vi.stubEnv(name, `present-${name}-value`);
                }
            }

            // Ato: chamar putObject deve lançar antes de tocar o SDK.
            let caught: unknown;
            try {
                await putObject(
                    "uploads/profile-id/test.bin",
                    Buffer.from([0x00]),
                    "application/octet-stream",
                );
            } catch (err) {
                caught = err;
            }

            // (a) Algo foi lançado.
            expect(caught).toBeDefined();
            // (b) É uma instância de `Error` (Requirement 1.4 — "erro
            //     descritivo").
            expect(caught).toBeInstanceOf(Error);

            const message = (caught as Error).message;

            // (c) A mensagem contém EVERY nome ausente.
            for (const name of missing) {
                expect(message).toContain(name);
            }

            // (d) A mensagem NÃO contém NENHUM nome presente — protege
            //     contra regressão do tipo "listou todas as 3 envvars
            //     mesmo as preenchidas".
            for (const name of present) {
                expect(message).not.toContain(name);
            }
        },
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3
// ─────────────────────────────────────────────────────────────────────────────

describe("Storage_Module — Property 3: ativação de Storage_Local_Fallback", () => {
    // Feature: migracao-infra-producao, Property 3: ativação de Storage_Local_Fallback
    // Validates: Requirements 1.5
    //
    // `isLocalFallbackMode(env)` aceita um snapshot de `NodeJS.ProcessEnv`
    // como parâmetro — não há necessidade de stubar `process.env` global.
    // Construímos `env` sintético a partir de 3 booleans (presença de cada
    // envvar R2 mínima) e um gerador para `NODE_ENV`. Isto isola a Property
    // de qualquer estado externo entre runs.
    //
    // Convenção: quando o boolean de presença é `false`, omitimos a chave
    // do objeto `env` (equivalente a `undefined` — `!env.NAME` é `true`).
    // Quando `true`, atribuímos uma string não-vazia distinta. A definição
    // canônica de "ausente" no `Storage_Module` é `!env.NAME`, que cobre
    // tanto `undefined` quanto string vazia (cf. `assertProductionEnvOrThrow`
    // e `isLocalFallbackMode` em `src/lib/storage.ts`).
    test.prop([
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.constantFrom(undefined, "test", "development", "production"),
    ])(
        "isLocalFallbackMode(env) ↔ (todas 3 envvars R2 ausentes) ∧ (NODE_ENV !== production)",
        (hasAccessKeyId, hasSecretAccessKey, hasBucketName, nodeEnv) => {
            // Construção do `env` sintético via spread condicional. Tipamos
            // o resultado como `NodeJS.ProcessEnv` (cast) porque o Next.js
            // declara `NODE_ENV` como readonly required no tipo global —
            // construir tudo de uma vez com `as` é o caminho idiomático.
            const env = {
                ...(hasAccessKeyId
                    ? { R2_ACCESS_KEY_ID: "present-access-key-id" }
                    : {}),
                ...(hasSecretAccessKey
                    ? { R2_SECRET_ACCESS_KEY: "present-secret-access-key" }
                    : {}),
                ...(hasBucketName
                    ? { R2_BUCKET_NAME: "present-bucket-name" }
                    : {}),
                ...(nodeEnv !== undefined ? { NODE_ENV: nodeEnv } : {}),
            } as NodeJS.ProcessEnv;

            // Definição esperada (referência da spec, Requirement 1.5):
            //   - "todas 3 ausentes" = nenhum dos 3 booleans de presença
            //     foi `true`.
            //   - "NODE_ENV !== production" — em particular, `undefined`,
            //     `"test"` e `"development"` satisfazem.
            const allMissing =
                !hasAccessKeyId && !hasSecretAccessKey && !hasBucketName;
            const notProduction = nodeEnv !== "production";
            const expected = allMissing && notProduction;

            // Bicondicional: o módulo retorna exatamente o esperado.
            expect(isLocalFallbackMode(env)).toBe(expected);
        },
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 4
// ─────────────────────────────────────────────────────────────────────────────

describe("Storage_Module — Property 4: fallback local — round-trip de bytes e idempotência S3 PUT", () => {
    // Estratégia de isolamento (Tasks 1.6 / Requirements 1.5, 1.7, 1.10):
    //
    //   - Um único `mkdtemp` por execução do `describe` block faz às vezes
    //     de `cwd` virtual; o `Storage_Module` resolve `public/<key>`
    //     relativo a esse temp via `vi.spyOn(process, "cwd")`.
    //   - `numRuns: 25` mantém a contagem de I/O modesta (cada run gera
    //     dois `writeFile` + dois `readFile`); aceitável vs. os default 100.
    //   - `vi.stubEnv` zera as 3 envvars R2 mínimas e seta `NODE_ENV`
    //     para um valor não-produção, garantindo que `isLocalFallbackMode`
    //     ative o caminho de filesystem (Requirement 1.5).
    //   - Cleanup em `afterAll`: `rm({ recursive, force })` apaga o tmp
    //     dir por completo; `mockRestore`/`unstubAllEnvs` revertem o
    //     ambiente para os describes seguintes.
    //
    // Nota sobre conflito de keys entre runs do fast-check: as Object_Keys
    // são geradas aleatoriamente por scope/owner/filename, mas duas runs
    // podem em tese colidir. A Property é robusta a isso porque o
    // contrato testado é exatamente "PUT sobrescreve no mesmo path", e
    // cada run faz dois PUTs sequenciais e lê de volta antes de cair na
    // próxima run — sem dependência do estado prévio do disco.

    let tmpRoot: string;

    beforeAll(async () => {
        tmpRoot = await mkdtemp(join(tmpdir(), "privello-storage-pbt4-"));
        vi.spyOn(process, "cwd").mockReturnValue(tmpRoot);
        vi.stubEnv("NODE_ENV", "test");
        // Empty string é falsy em JS, então `!env.NAME` retorna `true` e
        // `isLocalFallbackMode` avalia "ausente" — equivale a `undefined`
        // do ponto de vista do módulo (`assertProductionEnvOrThrow` e
        // `isLocalFallbackMode` ambos usam `!env.NAME`). Stubar com `""`
        // é o caminho que vitest oferece — não há `vi.unstubEnv` por
        // chave individual, e `delete process.env.NAME` não é compatível
        // com o tracking interno de `vi.stubEnv`.
        vi.stubEnv("R2_ACCESS_KEY_ID", "");
        vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
        vi.stubEnv("R2_BUCKET_NAME", "");
    });

    afterAll(async () => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        if (tmpRoot) {
            await rm(tmpRoot, { recursive: true, force: true });
        }
    });

    // Geradores Property 4 ──────────────────────────────────────────────
    //
    //   - `scope`  : três valores fixos do design (Object_Key canônica
    //                `<scope>/<owner>/<filename>`, Requirement 1.7).
    //   - `owner`  : CUID-like — `[a-z0-9]{8,30}`. Cobre o range observado
    //                de IDs do Prisma sem depender do formato exato.
    //   - `name`   : `[a-z0-9._-]{1,80}` — espelha o padrão de filename
    //                gerado pelos 5 Upload_Endpoints. Filtramos `.` e
    //                `..` exatos: ambos são interpretados como componentes
    //                de path por `path.join`, levando `dirname(filePath)`
    //                a apontar para um diretório que `writeFile` não pode
    //                sobrescrever (EISDIR). Não há perda de cobertura —
    //                esses dois tokens nunca são produzidos pelos sites
    //                reais (que sempre prefixam timestamp ou extensão).
    //   - `body`   : `uint8Array(0..1024)` — cobre arquivo vazio + médio.
    //                Limite 1 KB é suficiente para validar o round-trip
    //                de bytes; o teste não pretende stress-testar I/O.

    const scopeArb = fc.constantFrom("uploads", "audio", "verification");
    const ownerArb = fc.stringMatching(/^[a-z0-9]{8,30}$/);
    const filenameArb = fc
        .stringMatching(/^[a-z0-9._-]{1,80}$/)
        .filter((s) => s !== "." && s !== "..");
    const bodyArb = fc.uint8Array({ minLength: 0, maxLength: 1024 });

    // Feature: migracao-infra-producao, Property 4: fallback local — round-trip de bytes e idempotência S3 PUT
    // Validates: Requirements 1.5, 1.7, 1.10, NFR-COMPAT-3
    test.prop(
        [scopeArb, ownerArb, filenameArb, bodyArb, bodyArb],
        { numRuns: 25 },
    )(
        "putObject em fallback retorna URL relativa, persiste bytes e segundo PUT sobrescreve preservando URL",
        async (scope, owner, filename, b1, b2) => {
            const key = `${scope}/${owner}/${filename}`;
            const contentType = "application/octet-stream";

            // (1) Primeiro PUT: URL retornada == "/" + key (Requirement
            //     1.5 — formato relativo do Storage_Local_Fallback).
            const url1 = await putObject(key, b1, contentType);
            expect(url1).toBe(`/${key}`);

            // (2) Round-trip de bytes: ler de volta `<tmpRoot>/public/<key>`
            //     deve recuperar exatamente `b1` (Requirement 1.7 — sub-paths
            //     arbitrários aceitos sem corrupção de bytes).
            const filePath = join(tmpRoot, "public", key);
            const persisted1 = await readFile(filePath);
            expect(Array.from(persisted1)).toEqual(Array.from(b1));

            // (3) Segundo PUT na MESMA key com body distinto (`b2` pode
            //     coincidir com `b1` em runs raras — o teste é trivialmente
            //     verdadeiro nesse caso, sem perda de cobertura). URL
            //     retornada idêntica (Requirement 1.10 — idempotência S3
            //     PUT, contrato preservado em fallback local).
            const url2 = await putObject(key, b2, contentType);
            expect(url2).toBe(url1);

            // (4) Sobrescrita: o conteúdo no disco agora é `b2`
            //     (Requirement 1.10 — PUT na mesma key sobrescreve sem
            //     erro nem append).
            const persisted2 = await readFile(filePath);
            expect(Array.from(persisted2)).toEqual(Array.from(b2));
        },
    );
});

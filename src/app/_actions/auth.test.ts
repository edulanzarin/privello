/**
 * src/app/_actions/auth.test.ts
 *
 * Unit tests de `registerProviderAction` (`src/app/_actions/auth.ts`)
 * — Task 3.8 do spec `migracao-infra-producao`.
 *
 * Cobertura mínima exigida pela task:
 *
 *   - **Sucesso (Requirement 5.3)**: `putObject` resolve com URL → `prisma.media.create`
 *     é chamado com `{ profileId, url, isPublic: true, sortOrder: 0, isCover: true }`
 *     (a URL persistida é a retornada pelo Storage_Module). `signIn` chamado
 *     com as credentials e `redirectTo: "/painel"`.
 *
 *   - **Falha não-fatal (Requirements 5.2, 5.4)**: `putObject` rejeita →
 *     cadastro completa, `prisma.media.create` NÃO é chamado, `signIn` AINDA
 *     é chamado com as credenciais (auto-login fica fora do try/catch — Req
 *     5.4), e `console.warn` recebe payload estruturado com
 *     `endpoint: "register-provider-photo"`, `key`, `ownerId`, `contentType`,
 *     `size`, `error`.
 *
 * Estratégia de mock:
 *
 *   - `@/lib/storage`: `putObject` é `vi.fn()` controlado por teste.
 *   - `@/lib/auth`: `signIn` é `vi.fn()`. NextAuth normalmente lança um
 *     `redirect` no fluxo real; aqui mockamos como resolve para isolar do
 *     framework e asserter argumentos.
 *   - `@/lib/prisma`: stubs para `user.create`, `user.findUnique`,
 *     `profile.findUnique`, `profile.count`, `media.create`.
 *   - `@/lib/services`: `getOrCreateCityBySlug` resolve com `{ id }` fake.
 *
 * Cross-refs:
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` > Requirement 5
 *     (5.2, 5.3, 5.4).
 *   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
 *     Interfaces > 5.
 *   - `.kiro/specs/migracao-infra-producao/tasks.md` > Task 3.8.
 *   - `src/app/_actions/auth.ts` (`registerProviderAction`).
 *   - `src/lib/validation/auth.schema.ts` (`SignupProviderSchema`).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Mocks compartilhados — `vi.hoisted` para que o estado inicialize antes de
// qualquer factory de `vi.mock` ser invocado pelo Vitest.
// ─────────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
    putObject: vi.fn(),
    signIn: vi.fn(),
    userCreate: vi.fn(),
    userFindUnique: vi.fn(),
    profileFindUnique: vi.fn(),
    profileCount: vi.fn(),
    mediaCreate: vi.fn(),
    getOrCreateCityBySlug: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
    putObject: mocks.putObject,
}));

vi.mock("@/lib/auth", () => ({
    signIn: mocks.signIn,
}));

// `auth.ts` importa `AuthError` diretamente de `next-auth` (top-level). Sem
// um mock para `next-auth` o resolver tenta carregar o módulo real, que por
// sua vez tenta importar `next/server` em runtime de teste e falha. Stub
// minimalista: só precisamos da classe `AuthError` para o `instanceof` no
// `loginAction` resolver — `registerProviderAction` em si não a usa.
vi.mock("next-auth", () => ({
    AuthError: class AuthError extends Error {
        constructor(message?: string) {
            super(message);
            this.name = "AuthError";
        }
    },
}));

// `bcryptjs` é uma dependência nativa pesada que recompila em runtime; mock
// minimalista para acelerar o teste e evitar tocar o módulo real (não há
// asserção sobre o hash gerado nesta task).
vi.mock("bcryptjs", () => ({
    default: {
        hash: vi.fn(async (s: string) => `hashed:${s}`),
    },
}));

// `next/headers` é um módulo runtime do Next que requer contexto de request;
// `registerProviderAction` em si não chama `headers()`, mas o módulo
// `auth.ts` importa de `next/headers` no topo (para `loginAction`). Stub
// neutro evita explosão na resolução.
vi.mock("next/headers", () => ({
    headers: vi.fn(async () => new Map()),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            create: mocks.userCreate,
            findUnique: mocks.userFindUnique,
        },
        profile: {
            findUnique: mocks.profileFindUnique,
            count: mocks.profileCount,
        },
        media: {
            create: mocks.mediaCreate,
        },
    },
}));

vi.mock("@/lib/services", () => ({
    getOrCreateCityBySlug: mocks.getOrCreateCityBySlug,
}));

// Import APÓS os `vi.mock` para que o módulo sob teste resolva para os mocks.
import { registerProviderAction } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TEST_PROFILE_ID = "profile-cuid-xyz";
const TEST_USER_ID = "user-cuid-xyz";
const TEST_CITY_ID = "city-cuid-xyz";

/**
 * Constrói um File de tamanho `sizeBytes` preenchido com um byte fixo.
 */
function makePhotoFile(opts: {
    name?: string;
    type?: string;
    sizeBytes?: number;
} = {}): File {
    const {
        name = "foto.jpg",
        type = "image/jpeg",
        sizeBytes = 4096,
    } = opts;
    const bytes = new Uint8Array(sizeBytes).fill(0xab);
    return new File([bytes], name, { type });
}

/**
 * Monta um FormData satisfazendo `SignupProviderSchema` com defaults realistas.
 * Permite override de campos individuais via `overrides`.
 */
function makeProviderFormData(overrides: {
    photo?: File;
    durationsJson?: string;
} = {}): FormData {
    const fd = new FormData();
    fd.append("email", "novo.provider@example.com");
    fd.append("password", "supersenha123");
    fd.append("displayName", "Provider Teste");
    fd.append("slug", "provider-teste");
    fd.append("age", "25");
    fd.append("citySlug", "sao-paulo");
    fd.append("cityQuery", "São Paulo");
    fd.append("bio", "Bio de teste com pelo menos um caractere.");
    fd.append("documentType", "RG");
    fd.append(
        "durationsJson",
        overrides.durationsJson ??
        JSON.stringify([
            { minutes: 60, label: "1 hora", priceBrl: 500 },
            { minutes: 120, label: "2 horas", priceBrl: 900 },
        ]),
    );
    fd.append("photo", overrides.photo ?? makePhotoFile());
    return fd;
}

beforeEach(() => {
    mocks.putObject.mockReset();
    mocks.signIn.mockReset();
    mocks.userCreate.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.profileFindUnique.mockReset();
    mocks.profileCount.mockReset();
    mocks.mediaCreate.mockReset();
    mocks.getOrCreateCityBySlug.mockReset();

    // Defaults: cadastro happy-path (sem colisões, cidade existe, signIn ok).
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.profileFindUnique.mockResolvedValue(null);
    mocks.profileCount.mockResolvedValue(0);
    mocks.getOrCreateCityBySlug.mockResolvedValue({ id: TEST_CITY_ID });
    mocks.userCreate.mockResolvedValue({
        id: TEST_USER_ID,
        profile: { id: TEST_PROFILE_ID },
    });
    mocks.mediaCreate.mockResolvedValue({ id: "media-cuid-xyz" });
    // signIn: o NextAuth real lança um `redirect`; aqui basta resolver para
    // o teste asserir os argumentos sem acoplar ao framework. O caller
    // (`registerProviderAction`) não trata o retorno.
    mocks.signIn.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Sucesso — Requirement 5.3
// ─────────────────────────────────────────────────────────────────────────────

describe("registerProviderAction — sucesso do upload (Requirement 5.3)", () => {
    it("persiste a URL retornada por putObject em Media com isCover/sortOrder corretos e dispara signIn", async () => {
        const fakeUrl =
            "https://pub-test.r2.dev/uploads/profile-cuid-xyz/123.jpg";
        mocks.putObject.mockResolvedValueOnce(fakeUrl);

        const fd = makeProviderFormData();
        const result = await registerProviderAction(fd);

        // Action não retorna nada explícito em sucesso — só dispara signIn.
        expect(result).toBeUndefined();

        // putObject chamado exatamente uma vez com a Object_Key canônica
        // `uploads/<profileId>/<timestamp>.<ext>` e contentType correto.
        expect(mocks.putObject).toHaveBeenCalledTimes(1);
        const [keyArg, bodyArg, contentTypeArg] =
            mocks.putObject.mock.calls[0];
        expect(keyArg).toMatch(
            /^uploads\/profile-cuid-xyz\/\d+\.jpg$/,
        );
        expect(Buffer.isBuffer(bodyArg)).toBe(true);
        expect((bodyArg as Buffer).byteLength).toBe(4096);
        expect(contentTypeArg).toBe("image/jpeg");

        // prisma.media.create chamado com o shape exato exigido pela task:
        // { profileId, url, isPublic: true, sortOrder: 0, isCover: true }.
        expect(mocks.mediaCreate).toHaveBeenCalledTimes(1);
        expect(mocks.mediaCreate).toHaveBeenCalledWith({
            data: {
                profileId: TEST_PROFILE_ID,
                url: fakeUrl,
                isPublic: true,
                sortOrder: 0,
                isCover: true,
            },
        });

        // Auto-login disparado ao final com as mesmas credentials.
        expect(mocks.signIn).toHaveBeenCalledTimes(1);
        expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
            email: "novo.provider@example.com",
            password: "supersenha123",
            redirectTo: "/painel",
        });
    });

    it("mapeia image/png e image/webp para extensões corretas na Object_Key", async () => {
        // Roda 2 cadastros em sequência com tipos diferentes para checar o
        // mapeamento de extensão. Cada cadastro usa email/slug distintos
        // para evitar a colisão simulada no `userFindUnique` default.
        mocks.putObject.mockResolvedValue("https://pub.test/x");

        const fdPng = makeProviderFormData({
            photo: makePhotoFile({
                name: "foto.png",
                type: "image/png",
                sizeBytes: 32,
            }),
        });
        // Override email/slug para o segundo cadastro não bater com o primeiro
        // (os mocks de findUnique já retornam null, então não há colisão real;
        // este detalhe é só semântico).
        await registerProviderAction(fdPng);

        const fdWebp = makeProviderFormData({
            photo: makePhotoFile({
                name: "foto.webp",
                type: "image/webp",
                sizeBytes: 32,
            }),
        });
        await registerProviderAction(fdWebp);

        expect(mocks.putObject).toHaveBeenCalledTimes(2);
        const [pngKey] = mocks.putObject.mock.calls[0];
        const [webpKey] = mocks.putObject.mock.calls[1];
        expect(pngKey).toMatch(/\.png$/);
        expect(webpKey).toMatch(/\.webp$/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Falha não-fatal — Requirements 5.2, 5.4
// ─────────────────────────────────────────────────────────────────────────────

describe("registerProviderAction — falha do upload é não-fatal (Requirements 5.2, 5.4)", () => {
    it("absorve a exception, NÃO grava Media, AINDA chama signIn e emite log estruturado", async () => {
        const sentinel = new Error(
            "R2 indisponível: NoSuchBucket (simulado)",
        );
        mocks.putObject.mockRejectedValueOnce(sentinel);
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });

        const fd = makeProviderFormData();
        const result = await registerProviderAction(fd);

        // Action completa sem retornar erro (cadastro tem sucesso).
        expect(result).toBeUndefined();

        // putObject foi chamado uma vez (e rejeitou).
        expect(mocks.putObject).toHaveBeenCalledTimes(1);

        // Media NÃO foi criada — Requirement 5.2: cadastro completa sem
        // foto inicial.
        expect(mocks.mediaCreate).not.toHaveBeenCalled();

        // Auto-login executou mesmo após falha do upload — Requirement 5.4:
        // `signIn` fica fora do try/catch.
        expect(mocks.signIn).toHaveBeenCalledTimes(1);
        expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
            email: "novo.provider@example.com",
            password: "supersenha123",
            redirectTo: "/painel",
        });

        // Log estruturado com endpoint canônico e o erro original.
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const [payload] = warnSpy.mock.calls[0];
        expect(payload).toMatchObject({
            endpoint: "register-provider-photo",
            ownerId: TEST_PROFILE_ID,
            contentType: "image/jpeg",
            size: 4096,
            error: "R2 indisponível: NoSuchBucket (simulado)",
        });
        expect((payload as { key: string }).key).toMatch(
            /^uploads\/profile-cuid-xyz\/\d+\.jpg$/,
        );
        expect(typeof (payload as { ts: number }).ts).toBe("number");
    });

    it("normaliza erros não-Error para String(err) no campo `error` do log", async () => {
        // Cobre o branch ternário `err instanceof Error ? err.message : String(err)`
        // — garante que strings/throws crus não escapam crudamente.
        mocks.putObject.mockRejectedValueOnce("network down");
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });

        await registerProviderAction(makeProviderFormData());

        expect(mocks.mediaCreate).not.toHaveBeenCalled();
        expect(mocks.signIn).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        const [payload] = warnSpy.mock.calls[0];
        expect(payload).toMatchObject({
            endpoint: "register-provider-photo",
            error: "network down",
        });
    });
});

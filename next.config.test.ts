// next.config.test.ts
//
// Cobertura por exemplos de `buildRemotePatterns(env)` em `next.config.ts`.
//
// O Property 5 (`src/lib/r2-hostname.pbt.ts`) já cobre exaustivamente o
// parsing de `R2_PUBLIC_URL` em si; este arquivo testa a integração — o
// shape exato dos objetos `RemotePattern` produzidos quando a envvar está
// presente vs. ausente, garantindo que entradas estáveis (`picsum.photos`)
// nunca regridem.
//
// Cross-refs:
//   - .kiro/specs/migracao-infra-producao/requirements.md > Requirement 7.1, 7.2, 7.3
//   - .kiro/specs/migracao-infra-producao/design.md > Components and Interfaces > 7
//   - .kiro/specs/migracao-infra-producao/tasks.md > Task 5.2

import { describe, it, expect } from "vitest";
import { buildRemotePatterns } from "./next.config";

describe("next.config / buildRemotePatterns — entrada R2 condicional", () => {
    // `NodeJS.ProcessEnv` declara `NODE_ENV` como readonly obrigatório
    // (`next/types/global.d.ts`). Os testes não exercitam `NODE_ENV`; o cast
    // por `unknown` é o caminho idiomático recomendado pelo próprio TS para
    // evitar reproduzir o env real só para satisfazer o tipo.
    const envWithR2 = { R2_PUBLIC_URL: "https://pub-abc.r2.dev" } as unknown as NodeJS.ProcessEnv;
    const envWithoutR2 = {} as unknown as NodeJS.ProcessEnv;

    // **Validates: Requirements 7.1**
    it("inclui entrada R2 quando R2_PUBLIC_URL está definido", () => {
        const patterns = buildRemotePatterns(envWithR2);

        expect(patterns).toContainEqual({
            protocol: "https",
            hostname: "pub-abc.r2.dev",
            pathname: "/**",
        });
    });

    // **Validates: Requirements 7.2**
    it("não inclui entrada R2 quando R2_PUBLIC_URL está ausente", () => {
        const patterns = buildRemotePatterns(envWithoutR2);

        const hasR2Entry = patterns.some(
            (p) =>
                p.hostname.includes("r2.dev") ||
                p.hostname.includes("r2.cloudflarestorage.com"),
        );
        expect(hasR2Entry).toBe(false);
    });

    // **Validates: Requirements 7.3** (com R2_PUBLIC_URL)
    it("preserva entrada `picsum.photos` quando R2_PUBLIC_URL está definido", () => {
        const patterns = buildRemotePatterns(envWithR2);

        expect(patterns).toContainEqual({
            protocol: "https",
            hostname: "picsum.photos",
            pathname: "/**",
        });
    });

    // **Validates: Requirements 7.3** (sem R2_PUBLIC_URL)
    it("preserva entrada `picsum.photos` quando R2_PUBLIC_URL está ausente", () => {
        const patterns = buildRemotePatterns(envWithoutR2);

        expect(patterns).toContainEqual({
            protocol: "https",
            hostname: "picsum.photos",
            pathname: "/**",
        });
    });
});

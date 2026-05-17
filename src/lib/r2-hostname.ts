/**
 * Extração testável de hostname para `next.config.ts > images.remotePatterns`.
 *
 * Função pura introduzida pela migração `migracao-infra-producao` (Task 2.1)
 * para isolar a lógica de parsing de `R2_PUBLIC_URL` do `next.config.ts` e
 * permitir cobertura por property tests sem mockar Next.js.
 *
 * Cross-refs:
 *   - .kiro/specs/migracao-infra-producao/requirements.md > Requirement 7.1, 7.2
 *   - .kiro/specs/migracao-infra-producao/design.md > Components and Interfaces > 7
 *   - .kiro/specs/migracao-infra-producao/design.md > Correctness Properties > Property 5
 */

/**
 * Extrai o hostname canônico de uma URL HTTPS.
 *
 * - Aceita `string | undefined`.
 * - Retorna o `hostname` (lowercase, sem porta, sem path) quando `raw` é uma
 *   URL HTTPS bem-formada (parseável por `new URL(raw)` com
 *   `protocol === "https:"`).
 * - Retorna `null` para `undefined`, string vazia, URLs inválidas, ou URLs
 *   cujo protocolo não seja `https:` (ex.: `http:`, `ftp:`, `data:`).
 * - Nunca lança: erros do construtor `URL` são absorvidos.
 *
 * @param raw URL bruta vinda do ambiente (tipicamente `process.env.R2_PUBLIC_URL`).
 * @returns Hostname extraído, ou `null` se inválido.
 */
export function extractR2Hostname(raw: string | undefined): string | null {
    if (!raw) return null;
    let parsed: URL;
    try {
        parsed = new URL(raw);
    } catch {
        return null;
    }
    if (parsed.protocol !== "https:") return null;
    // `URL#hostname` já é lowercase por contrato WHATWG; toLowerCase é
    // defensivo e mantém a invariante explícita ainda que o parser mude.
    return parsed.hostname.toLowerCase();
}

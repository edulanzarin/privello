/**
 * Tipo das variantes do `Badge` aplicáveis a status do domínio.
 *
 * Subset das variantes do `Badge` que fazem sentido como sinal de status,
 * deliberadamente excluindo `default` e `dark` (não-status).
 *
 * @see Requirement 3 em `.kiro/specs/redesign-macos-system/requirements.md`
 */
export type StatusBadgeVariant =
    | "info"
    | "warning"
    | "success"
    | "muted"
    | "danger"
    | "premium"
    | "coral";

/**
 * Mapa canônico status do domínio → variante de `Badge`.
 *
 * Implementado como `Map` (em vez de objeto literal) para evitar prototype
 * pollution: `Object.prototype` expõe membros como `toString`, `valueOf`,
 * `hasOwnProperty`, `__proto__` e `constructor` que vazariam em uma lookup do
 * tipo `obj[key]`, fazendo o operador `??` falhar em retornar o fallback
 * `"muted"` para essas strings. `Map.prototype.get` só retorna `undefined`
 * para chaves não inseridas, garantindo o fallback determinístico exigido
 * pelo Requirement 3.10.
 *
 * Convenções de casing seguem o domínio: enums Prisma em UPPER_CASE
 * (`NOVO`, `APROVADO`, `BANIDO`, etc.), valores legados em camel/lowercase
 * (`pending`, `verificado`, `cancelled`).
 */
const STATUS_TO_VARIANT: ReadonlyMap<string, StatusBadgeVariant> = new Map<
    string,
    StatusBadgeVariant
>([
    // Aberto / novo
    ["NOVO", "info"],
    ["OPEN", "info"],

    // Em andamento / revisão
    ["REVISAO", "warning"],
    ["IN_PROGRESS", "warning"],
    ["pending", "warning"],

    // Aprovado / verificado
    ["APROVADO", "success"],
    ["verificado", "success"],

    // Rejeitado / fechado / cancelado
    ["REJEITADO", "muted"],
    ["CLOSED", "muted"],
    ["cancelled", "muted"],

    // Banido / suspenso
    ["BANIDO", "danger"],
    ["SUSPENSO", "danger"],

    // Planos
    ["PREMIUM", "premium"],
    ["DESTAQUE", "coral"],
    ["ESSENCIAL", "info"],
]);

/**
 * Mapeia um status do domínio para a variante correspondente do `Badge`.
 *
 * Função total: para qualquer string fora do domínio conhecido, retorna
 * deterministicamente `"muted"`, evitando que páginas precisem reimplementar
 * `STATUS_COLORS` ou `PLAN_COLORS` inline.
 *
 * @param status - Valor de status vindo do domínio (Prisma enum, string legada
 * ou texto arbitrário).
 * @returns Variante de `Badge` correspondente, ou `"muted"` como fallback.
 */
export function statusToBadgeVariant(status: string): StatusBadgeVariant {
    return STATUS_TO_VARIANT.get(status) ?? "muted";
}

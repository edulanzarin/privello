/**
 * Helpers genéricos de coerção para `FormData` antes de aplicar schemas Zod.
 *
 * Nota: Tarefa 4.2 do spec `fase-1-seguranca`. Apenas helpers — schemas Zod
 * vivem nos `*.schema.ts` deste mesmo diretório. Consumo nos handlers/actions
 * é feito na Tarefa 4.4.
 */

/**
 * Converte um `FormData` em `Record<string, unknown>` agrupando campos
 * repetidos em arrays (paridade com `Object.fromEntries(fd)` mas preservando
 * múltiplos valores para a mesma chave). Não altera tipos: tudo continua
 * `string | File`. A coerção fica a cargo do schema (`z.coerce.boolean()`,
 * `z.coerce.number()`) ou dos helpers abaixo.
 */
export function formDataToObject(fd: FormData): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of new Set(fd.keys())) {
        const all = fd.getAll(key);
        out[key] = all.length > 1 ? all : all[0];
    }
    return out;
}

/**
 * Converte os valores típicos de um checkbox HTML em boolean.
 * - "on", "1", "true", true → `true`
 * - undefined, null, "", "0", "false", false → `false`
 * Idempotente: aceitar booleano direto retorna o próprio booleano.
 */
export function coerceCheckbox(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (value == null) return false;
    if (typeof value === "string") {
        const v = value.trim().toLowerCase();
        return v === "on" || v === "1" || v === "true";
    }
    return Boolean(value);
}

/**
 * Converte uma string numérica em `number`. Retorna `undefined` para
 * entradas vazias/ausentes para que o schema decida se o campo é
 * obrigatório (`.default(...)` ou ausência via `.optional()`).
 *
 * Idempotente: passar um número retorna o mesmo número (NaN preservado).
 */
export function coerceNumber(value: unknown): number | undefined {
    if (typeof value === "number") return value;
    if (value == null) return undefined;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") return undefined;
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : NaN;
    }
    return undefined;
}

/**
 * Faz `JSON.parse` de um campo string, devolvendo `undefined` para
 * entradas ausentes/vazias. Em caso de JSON inválido devolve um
 * marcador `JSON_PARSE_ERROR` que o schema pode capturar via
 * `.refine(...)` ou `.transform(...)` para reportar erro adequado.
 *
 * Idempotente: passar um valor já parseado retorna o próprio valor.
 */
export const JSON_PARSE_ERROR = Symbol("JSON_PARSE_ERROR");
export type JsonParseError = typeof JSON_PARSE_ERROR;

export function coerceJson(value: unknown): unknown | JsonParseError | undefined {
    if (value == null) return undefined;
    if (typeof value !== "string") return value; // já parseado
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    try {
        return JSON.parse(trimmed);
    } catch {
        return JSON_PARSE_ERROR;
    }
}

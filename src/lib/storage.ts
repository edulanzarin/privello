/**
 * Storage_Module — abstração canônica de persistência de mídia para o Privello.
 *
 * Esta é a única superfície de código que conhece o Cloudflare R2; os 5
 * `Upload_Endpoints` (api/upload, api/upload-audio, api/upload/verification,
 * `registerProviderAction`, `uploadClientAvatarAction`) consomem esta API e
 * trocam de provedor (R2 → S3 → B2) seria uma edição deste único arquivo.
 *
 * Modos de operação:
 *
 *   - **R2 (produção)**: SDK `@aws-sdk/client-s3` v3 contra
 *     `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` com SigV4 (default
 *     do SDK v3 — atende NFR-SEC-3). URL pública composta com
 *     `R2_PUBLIC_URL` + Object_Key, sem barra duplicada.
 *
 *   - **`Storage_Local_Fallback` (dev/teste)**: ativa **somente** quando as
 *     três envvars `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
 *     `R2_BUCKET_NAME` estão **completamente ausentes** e
 *     `NODE_ENV !== "production"`. Escreve em `public/<key>` no filesystem
 *     local e retorna URL relativa `/<key>`. Preserva o fluxo de seed local
 *     atual sem tocar a rede. Envvars presentes mas inválidas, ou R2
 *     inacessível, NÃO ativam fallback — propagam erro original do SDK
 *     (Requirement 1.5).
 *
 *   - **Produção sem credenciais**: `assertProductionEnvOrThrow` lança
 *     `Error` descritivo listando exatamente quais das 3 envvars
 *     obrigatórias estão ausentes (Requirement 1.4 / 1.4.1).
 *
 * Notas de design:
 *
 *   - **Envs lidas por chamada**, não em `import time`. Permite que os
 *     property tests (Tasks 1.4–1.6) mutem `process.env` entre runs sem
 *     re-importar o módulo.
 *   - **`S3Client` construído por chamada** (cheap em SDK v3) em vez de
 *     singleton lazy — evita estado pegajoso quando envs são modificadas
 *     entre testes; mantém o caveat do design de não instanciar em import
 *     time (caminhos de fallback nunca tocam o SDK).
 *   - **Sem retry automático** (NFR-DUR-2): erros do SDK propagam intactos
 *     para o caller decidir o `HTTP status`.
 *   - **Idempotência S3 PUT** (Requirement 1.10): `PutObjectCommand` em
 *     chave existente sobrescreve sem erro — contrato S3 padrão herdado.
 *   - **No-op em `deleteObject` no fallback local** — segurança contra
 *     path traversal: o módulo nunca apaga arquivos do disco em dev,
 *     mesmo com Object_Key benigna.
 *   - **Sem logging de credenciais nem bytes** (NFR-OBS-2): o módulo não
 *     emite logs próprios; callers logam metadados (`endpoint`, `key`,
 *     `size`) na linha estruturada padronizada.
 *
 * Cross-refs:
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` >
 *     Requirement 1 (1.1, 1.2, 1.3, 1.4, 1.4.1, 1.5, 1.6, 1.7, 1.8, 1.10).
 *   - `.kiro/specs/migracao-infra-producao/requirements.md` > §5 NFRs
 *     (NFR-SEC-3, NFR-DUR-2, NFR-OBS-2, NFR-OBS-3, NFR-COMPAT-3).
 *   - `.kiro/specs/migracao-infra-producao/design.md` > Components and
 *     Interfaces > 1. `src/lib/storage.ts`.
 */

import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Compõe a URL pública sem barra duplicada, independente de `base` terminar
 * com `/` ou de `key` começar com `/`. Preserva o `://` do esquema (não
 * colapsa as duas barras pós-protocolo).
 *
 * Exposta para testes (Property 1) e consumida internamente por
 * `putObject` em modo R2.
 *
 * @param base URL base (ex.: `R2_PUBLIC_URL`).
 * @param key Object_Key relativa (ex.: `uploads/<id>/<file>`).
 * @returns `${base sem barras finais}/${key sem barras iniciais}`.
 */
export function joinPublicUrl(base: string, key: string): string {
    const trimmedBase = base.replace(/\/+$/, "");
    const trimmedKey = key.replace(/^\/+/, "");
    return `${trimmedBase}/${trimmedKey}`;
}

/**
 * `true` quando o `Storage_Local_Fallback` deve ser ativado: as três envvars
 * mínimas (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`)
 * estão **completamente ausentes** E `NODE_ENV !== "production"`.
 *
 * `R2_ACCOUNT_ID` e `R2_PUBLIC_URL` não participam da decisão — são
 * necessárias para o R2 funcionar mas não diferenciam fallback de erro de
 * config (Requirement 1.5 + design notas).
 *
 * Exposta para testes (Property 3 / Task 1.5).
 *
 * @param env Snapshot de `process.env` (default: o atual). Receber como
 *   parâmetro permite que property tests construam ambientes sintéticos
 *   sem mutar o `process.env` global.
 * @returns `true` se fallback local; `false` caso contrário.
 */
export function isLocalFallbackMode(
    env: NodeJS.ProcessEnv = process.env,
): boolean {
    const allMissing =
        !env.R2_ACCESS_KEY_ID &&
        !env.R2_SECRET_ACCESS_KEY &&
        !env.R2_BUCKET_NAME;
    return allMissing && env.NODE_ENV !== "production";
}

/**
 * Em `NODE_ENV === "production"`, valida a **presença** das três envvars R2
 * obrigatórias e lança `Error` descritivo listando exatamente as ausentes.
 * Em qualquer outro `NODE_ENV`, é no-op.
 *
 * Não valida formato/credenciais válidas — só presença (Requirement 1.4.1):
 * credenciais inválidas são detectadas pelo SDK no primeiro `putObject`/
 * `deleteObject` e propagam erro do SDK conforme Requirement 1.8.
 */
function assertProductionEnvOrThrow(env: NodeJS.ProcessEnv): void {
    if (env.NODE_ENV !== "production") return;
    const missing: string[] = [];
    if (!env.R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
    if (!env.R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
    if (!env.R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");
    if (missing.length > 0) {
        throw new Error(
            `Storage_Module: envvar(s) ausente(s) em produção: ${missing.join(", ")}`,
        );
    }
}

/**
 * Constrói um `S3Client` configurado para o Cloudflare R2 lendo as envvars
 * `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` no momento da
 * chamada. Construção por chamada (em vez de singleton) garante que mudanças
 * em `process.env` entre testes refletem imediatamente, sem necessidade de
 * `__resetForTests`. O custo de construção do `S3Client` v3 é desprezível
 * comparado ao round-trip de rede do `send()`.
 *
 * `region: "auto"` é a recomendação Cloudflare para R2; o endpoint segue o
 * formato canônico documentado em `docs/deploy-railway.md`. SigV4 é o
 * default do SDK v3 — atende NFR-SEC-3 sem configuração explícita.
 */
function buildS3Client(env: NodeJS.ProcessEnv): S3Client {
    const accountId = env.R2_ACCOUNT_ID ?? "";
    const accessKeyId = env.R2_ACCESS_KEY_ID ?? "";
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY ?? "";
    return new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
    });
}

/**
 * Persiste `body` em `key` no `R2_Bucket` (modo R2) ou em `public/<key>` no
 * filesystem local (modo `Storage_Local_Fallback`).
 *
 * Comportamento:
 *
 *   - **Fallback local** (envvars R2 ausentes em dev/teste): cria diretórios
 *     com `mkdir({ recursive: true })`, escreve o arquivo com `writeFile`,
 *     retorna `/<key>` (URL relativa servida pelo Next.js a partir de
 *     `public/`).
 *   - **Produção sem credenciais**: lança `Error` descritivo (não toca o
 *     filesystem nem a rede).
 *   - **R2**: `PutObjectCommand` com `Bucket=R2_BUCKET_NAME`, `Key=key`,
 *     `Body=body`, `ContentType=contentType`. Retorna URL pública absoluta
 *     `joinPublicUrl(R2_PUBLIC_URL, key)`. Erros do SDK propagam intactos
 *     (Requirement 1.8 / NFR-OBS-3).
 *
 * Idempotência: chamadas repetidas com a mesma `key` sobrescrevem o objeto
 * sem erro — contrato S3 padrão (Requirement 1.10).
 *
 * @param key Object_Key sem barras iniciais. Sub-paths arbitrários são
 *   aceitos sem validação de formato (Requirement 1.7).
 * @param body Bytes do arquivo (`Buffer` ou `Uint8Array`).
 * @param contentType MIME válido (ex.: `"image/jpeg"`).
 * @returns URL pública composta (absoluta em modo R2; relativa em fallback).
 * @throws `Error` em produção sem credenciais; erros do SDK em modo R2.
 */
export async function putObject(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
): Promise<string> {
    const env = process.env;
    if (isLocalFallbackMode(env)) {
        const trimmedKey = key.replace(/^\/+/, "");
        const filePath = join(process.cwd(), "public", trimmedKey);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, body);
        return `/${trimmedKey}`;
    }
    assertProductionEnvOrThrow(env);
    const bucket = env.R2_BUCKET_NAME ?? "";
    const publicUrl = env.R2_PUBLIC_URL ?? "";
    const client = buildS3Client(env);
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
    );
    return joinPublicUrl(publicUrl, key);
}

/**
 * Remove `key` do `R2_Bucket` (modo R2). No-op silencioso em
 * `Storage_Local_Fallback` — segurança contra path traversal: o módulo nunca
 * apaga arquivos do disco em dev mesmo com Object_Key benigna.
 *
 * Erros do SDK propagam intactos (Requirement 1.8 / NFR-OBS-3). Sem retry
 * automático (NFR-DUR-2).
 *
 * @param key Object_Key a remover.
 * @throws `Error` em produção sem credenciais; erros do SDK em modo R2.
 */
export async function deleteObject(key: string): Promise<void> {
    const env = process.env;
    if (isLocalFallbackMode(env)) return;
    assertProductionEnvOrThrow(env);
    const bucket = env.R2_BUCKET_NAME ?? "";
    const client = buildS3Client(env);
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

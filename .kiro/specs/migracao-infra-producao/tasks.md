# Implementation Plan: Migração de infraestrutura para produção

> **Spec:** `migracao-infra-producao`
> **Workflow:** `requirements-first` / `feature`
> **Linguagem:** TypeScript (Next.js 16 + Node 20)

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Overview

A entrega é estritamente de infraestrutura: **uma abstração nova** (`src/lib/storage.ts` — Storage_Module) e **refactors mecânicos** nos 5 Upload_Endpoints. As demais tasks são configuração (Dockerfile, `next.config.ts`, `.env.example`) e documentação operacional (`docs/deploy-railway.md`, CHANGELOG, move de docs legacy).

A ordem é: (1) fundamenta o módulo + função pura de hostname, com cobertura PBT; (2) refatora os 5 sites de upload em paralelo, cada um com seus testes; (3) wire-up de configuração (`next.config.ts`); (4) container e docs operacionais. Cada checkpoint valida `lint + tsc + test` antes de prosseguir.

## Tasks

- [x] 1. Foundation — Storage_Module
  - [x] 1.1 Adicionar dependência `@aws-sdk/client-s3` ao `package.json`
    - Adicionar `@aws-sdk/client-s3` em `dependencies` com versão pin (ex.: `"^3.700.0"`).
    - Rodar `npm install` para atualizar `package-lock.json`.
    - Confirmar que o pacote está na lista default de `serverExternalPackages` do Next.js (consulta já documentada no design — nenhuma config extra em `next.config.ts`).
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Implementar `src/lib/storage.ts` com `putObject`, `deleteObject`, `joinPublicUrl`, `isLocalFallbackMode`
    - Implementar a API pública conforme JSDoc do design § "Components and Interfaces > 1".
    - Lazy-init do `S3Client` (`region: "auto"`, endpoint `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, SigV4 default do SDK v3).
    - `assertProductionEnvOrThrow` valida apenas presença das 3 envvars obrigatórias e lança erro descritivo listando exatamente as ausentes.
    - `Storage_Local_Fallback`: escreve em `public/<key>` com `mkdir({ recursive: true })` + `writeFile`, retorna `/<key>`.
    - `joinPublicUrl` faz trim de barras finais/iniciais para evitar `//`.
    - `deleteObject` é no-op em fallback local (segurança contra path traversal).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.4.1, 1.5, 1.6, 1.7, 1.8, 1.10, NFR-SEC-3, NFR-DUR-2_

  - [x] 1.3 Property test 1 em `src/lib/storage.pbt.ts` — `joinPublicUrl` é composição idempotente
    - **Property 1: `joinPublicUrl` é composição idempotente sem barra duplicada**
    - **Validates: Requirements 1.6**
    - Geradores: `fc.webUrl` filtrado para `https://`, sufixos/prefixos de barras aleatórios, `fc.string` para a key.
    - Asserts: começa com `base.replace(/\/+$/, "")`; sem `//` exceto no `://` do esquema; idempotente sob trimming.
    - Comentário-tag: `// Feature: migracao-infra-producao, Property 1: ... // Validates: Requirements 1.6, NFR-RB-3`.
    - _Requirements: 1.6, NFR-RB-3_

  - [x] 1.4 Property test 2 em `src/lib/storage.pbt.ts` — erro descritivo em produção sem credenciais
    - **Property 2: Erro descritivo em produção sem credenciais**
    - **Validates: Requirements 1.4, 1.4.1**
    - Gerador: `fc.subarray(["R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET_NAME"])` filtrando subset não-vazio; `NODE_ENV = "production"`.
    - Asserts: `putObject` lança `Error` cuja mensagem contém os nomes do subset ausente e nenhum dos preenchidos.
    - Resetar `process.env` no `afterEach` para evitar contaminação entre runs.
    - _Requirements: 1.4, 1.4.1_

  - [x] 1.5 Property test 3 em `src/lib/storage.pbt.ts` — ativação de `Storage_Local_Fallback`
    - **Property 3: Ativação de `Storage_Local_Fallback`**
    - **Validates: Requirements 1.5**
    - Geradores: 3× `fc.boolean` para presença de cada envvar R2 + `fc.constantFrom(undefined,"test","development","production")` para `NODE_ENV`.
    - Assert: `isLocalFallbackMode(env)` ↔ (todas 3 ausentes) ∧ (`NODE_ENV !== "production"`).
    - _Requirements: 1.5_

  - [x] 1.6 Property test 4 em `src/lib/storage.pbt.ts` — fallback local round-trip + idempotência S3 PUT
    - **Property 4: Fallback local — round-trip de bytes e idempotência S3 PUT**
    - **Validates: Requirements 1.5, 1.7, 1.10**
    - Usar `tmpdir` como `cwd` durante o teste (ou monkey-patch `process.cwd`) para isolar do `public/` real.
    - Geradores: scope ∈ `{uploads, audio, verification}`; owner CUID-like (`fc.stringMatching(/^[a-z0-9]{8,30}$/)`); filename `[a-z0-9._-]{1,80}`; `fc.uint8Array({ minLength: 0, maxLength: 1024 })` para body.
    - Asserts: URL retornada = `"/" + key`; bytes do arquivo == `b1`; segundo PUT sobrescreve; URL idêntica.
    - _Requirements: 1.5, 1.7, 1.10, NFR-COMPAT-3_

  - [x] 1.7 Unit tests em `src/lib/storage.test.ts` — examples e modos de erro
    - SDK error propagation: mockar `S3Client.send` para rejeitar com `NoSuchBucket`/`AccessDenied`; assert que `putObject` lança o mesmo erro original sem wrapping (NFR-OBS-3).
    - `deleteObject` chama `DeleteObjectCommand` em modo R2 e é no-op em fallback.
    - `S3Client` instanciado com `region: "auto"` e endpoint canônico R2 (NFR-SEC-3).
    - `console.warn` spy: nenhum log emitido pelo módulo contém `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` (NFR-OBS-2).
    - Não há retry automático em falha (NFR-DUR-2): mock que rejeita 1× faz `putObject` rejeitar; `S3Client.send` chamado exatamente 1×.
    - _Requirements: 1.2, 1.3, 1.8, 1.9, NFR-DUR-2, NFR-OBS-2, NFR-OBS-3, NFR-SEC-3_

- [x] 2. Foundation — extração testável de hostname para `next.config.ts`
  - [x] 2.1 Criar `src/lib/r2-hostname.ts` exportando `extractR2Hostname`
    - Função pura: aceita `string | undefined`, retorna `string | null`.
    - Usa `new URL(raw)`; valida `protocol === "https:"`; retorna `hostname` (lowercase, sem porta, sem path).
    - Strings vazias/`undefined`/inválidas → `null` sem throw.
    - _Requirements: 7.1, 7.2_

  - [x] 2.2 Property test 5 em `src/lib/r2-hostname.pbt.ts`
    - **Property 5: Extração de hostname para `images.remotePatterns`**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Geradores: `fc.webUrl` filtrado `https://` (válido); `fc.oneof(fc.constant(""), fc.constant(undefined), fc.string())` (inválido).
    - Asserts: HTTPS válida → hostname extraído via `URL`; inválida → `null`; resultado nunca contém `"*"` (sem curinga).
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 3. Refactors dos 5 Upload_Endpoints
  - [x] 3.1 Refatorar `src/app/api/upload/route.ts` para usar `putObject`
    - Remover imports `writeFile`, `mkdir` de `fs/promises` e `join` de `path`.
    - Importar `putObject` de `@/lib/storage`.
    - Object_Key: `uploads/<profileId>/<filename>`.
    - Manter ordem das validações (auth → rate limit → Zod → MIME → tamanho → Content-Length → `putObject`).
    - Em erro: HTTP 500 `{ error: "Falha ao enviar arquivo." }` + `console.warn` estruturado com `endpoint: "upload"`.
    - Em sucesso: log estruturado `ok: true`; preservar branch `REEL`/`story` retornando `{ ok: true, url }` e branch normal retornando `{ ok: true, media }`.
    - Atualizar JSDoc do arquivo (substituir aviso "uploads em filesystem local" por descrição do Storage_Module).
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, NFR-OBS-1, NFR-OBS-2, NFR-COMPAT-2_

  - [x] 3.2 Atualizar/criar testes de `src/app/api/upload/route.ts`
    - Mock `putObject` em modo sucesso: assert URL persistida em `Media.url` e shape de retorno preservado.
    - Mock `putObject` rejeitando: assert HTTP 500 com mensagem pt-BR e log estruturado emitido.
    - Validações inválidas (MIME ruim, tamanho > limite) NÃO chamam `putObject` (compõe Property 6).
    - Confirmar ausência de `mkdir`/`writeFile` (grep estático no teste ou snapshot de imports).
    - _Requirements: 2.2, 2.4, 2.7, NFR-COMPAT-2_

  - [x] 3.3 Refatorar `src/app/api/upload-audio/route.ts` para usar `putObject`
    - Object_Key: `audio/<profileId>/audio-<timestamp>.<ext>`.
    - Manter todas as validações existentes (auth, Zod, MIME, `MAX_AUDIO_BYTES`, Content-Length).
    - Em erro: HTTP 500 `{ error: "Falha ao enviar áudio." }` + log estruturado `endpoint: "upload-audio"`.
    - Persistir URL em `Profile.audioUrl`.
    - Handler `DELETE` permanece **inalterado**: apenas seta `audioUrl = null` em DB; **NÃO** chama `deleteObject` (retenção permanente).
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, NFR-OBS-1, NFR-COMPAT-2_

  - [x] 3.4 Atualizar/criar testes de `src/app/api/upload-audio/route.ts`
    - Mock `putObject` em modo sucesso: URL persistida em `Profile.audioUrl`.
    - Mock `putObject` rejeitando: HTTP 500 + log estruturado.
    - Teste explícito do `DELETE`: chama `prisma.profile.update({ audioUrl: null })` e **não** chama `deleteObject` (spy assert 0 calls).
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [x] 3.5 Refatorar `src/app/api/upload/verification/route.ts` para usar `putObject`
    - Object_Key: `verification/<profileId>/<timestamp>-<rand>.<ext>`.
    - Manter validações Zod, MIME, tamanhos separados imagem (≤ 10 MB) / vídeo (≤ 150 MB).
    - Em erro: log estruturado envolto em try/catch (logger pode falhar) + HTTP 500 `{ error: "Falha ao enviar documento." }` mesmo se logger lançar.
    - Resposta de sucesso: `{ ok: true, url }` para `submitVerificationCase` consumir.
    - Presigned_URL **não** implementado nesta fase; documentar como blocker em `docs/deploy-railway.md` (task 7.1).
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, NFR-OBS-1, NFR-COMPAT-2_

  - [x] 3.6 Atualizar/criar testes de `src/app/api/upload/verification/route.ts`
    - Mock `putObject` em modo sucesso: URL retornada no payload.
    - Mock `putObject` rejeitando + `console.warn` configurado para lançar: handler ainda retorna HTTP 500 (Req 4.6).
    - Validações inválidas não chamam `putObject`.
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 3.7 Refatorar `registerProviderAction` em `src/app/_actions/auth.ts`
    - Remover `import("fs/promises")` e `import("path")` dinâmicos do bloco interno.
    - Adicionar `import { putObject } from "@/lib/storage"` no topo.
    - Object_Key: `uploads/<profileId>/<timestamp>.<ext>`.
    - Try/catch absorve falha de `putObject` (não-fatal); log estruturado `endpoint: "register-provider-photo"`; cadastro completa sem `Media` inicial.
    - `await signIn("credentials", ...)` permanece **fora** do try/catch — auto-login executa mesmo após falha do upload.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, NFR-OBS-1, NFR-COMPAT-2_

  - [x] 3.8 Atualizar/criar testes de `registerProviderAction` em `src/app/_actions/auth.test.ts`
    - Mock `putObject` em sucesso: assert `prisma.media.create` chamado com URL retornada e `isCover: true, sortOrder: 0`.
    - Mock `putObject` rejeitando: assert cadastro completa, `signIn` é chamado, log estruturado emitido.
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 3.9 Refatorar `uploadClientAvatarAction` em `src/app/_actions/client-profile.ts`
    - Object_Key: `uploads/<userId>/<timestamp>-<rand>.<ext>` (note: `userId`, não `profileId`).
    - Try/catch envolve `putObject`; em qualquer exception retorna `{ error: "Falha ao enviar avatar." }` sem propagar.
    - Em sucesso: `prisma.user.update({ image: url })` permanece após o `putObject`.
    - Manter validações (auth, Zod `UploadClientAvatarSchema`, MIME, ≤ 5 MB).
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, NFR-COMPAT-2_

  - [x] 3.10 Atualizar/criar testes de `uploadClientAvatarAction`
    - Mock `putObject` em sucesso: `User.image` atualizado.
    - Mock `putObject` lançando exception arbitrária: server action retorna `{ error: "Falha ao enviar avatar." }` sem propagar.
    - Validações inválidas não chamam `putObject`.
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 3.11 Property test 6 em `tests/uploads/validation-precedes-putobject.pbt.ts`
    - **Property 6: Validação de MIME/tamanho precede `putObject`**
    - **Validates: Requirements 2.2, 3.2, 4.2, 6.2**
    - Tabela-fixture mapeando cada upload site para `{ allowedMimes, maxBytes, harness }`.
    - Geradores: `fc.constantFrom([...invalidMimes])`, `fc.integer({ min: limit+1, max: limit*2 })` para tamanho excedente.
    - Asserts: status 4xx (400/413) ou shape `{ error }`; spy em `putObject` registra exatamente 0 chamadas.
    - _Requirements: 2.2, 3.2, 4.2, 6.2, NFR-SEC-4_

- [x] 4. Checkpoint — Ensure all tests pass
  - Rodar `npm run lint` (0 problems), `npx tsc --noEmit` (0 erros), `npm run test` (305+ verdes incluindo os novos PBTs e unit tests do Storage_Module e dos 5 sites).
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Configuração do Next.js
  - [x] 5.1 Atualizar `next.config.ts` — `images.remotePatterns` e `output: "standalone"`
    - Importar `extractR2Hostname` de `@/lib/r2-hostname`.
    - Construir `remotePatterns` com spreads condicionais: entrada R2 incluída só se `extractR2Hostname(process.env.R2_PUBLIC_URL)` retornar string; entrada `PRODUCTION_HOSTNAME` preservada; demais entradas (`picsum.photos`, googleapis, googleusercontent) intactas.
    - Sem `hostname: "**"` em qualquer entrada.
    - Adicionar `output: "standalone"` ao `nextConfig`.
    - Comentário in-file (AGENTS_Rule) ligando à consulta `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md` (caveat: `.next/standalone` não inclui `public/` nem `.next/static/`).
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1_

  - [x] 5.2 Snapshot test em `next.config.test.ts` — `remotePatterns` com e sem `R2_PUBLIC_URL`
    - Importar a função que constrói `remotePatterns` (refatorar `next.config.ts` para exportá-la se necessário).
    - Asserts: com `R2_PUBLIC_URL=https://pub-abc.r2.dev` definido, o array contém `{ protocol: "https", hostname: "pub-abc.r2.dev", pathname: "/**" }`; sem `R2_PUBLIC_URL`, o array não contém entrada R2; sempre preserva `picsum.photos`.
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. Containerização
  - [x] 6.1 Criar `Dockerfile` multi-stage na raiz
    - 3 estágios: `deps` (npm ci omitting dev), `builder` (npm ci full + `npx prisma generate` + `npm run build`), `runner` (Alpine, `NODE_ENV=production`, usuário não-root `nextjs:1001`).
    - Runner copia `.next/standalone`, `.next/static`, `public/`, e `node_modules/{.prisma,@prisma,prisma}` + `prisma/` (migrations).
    - `LABEL org.opencontainers.image.revision=${GIT_SHA:-unknown}` (SHA do commit para rollback identificável).
    - `CMD ["sh","-c","node node_modules/prisma/build/index.js migrate deploy && node server.js"]` — migrate deploy idempotente antes do server.
    - Apk packages: `libc6-compat`, `openssl` (Prisma engine `linux-musl-openssl-3.0.x`).
    - Comentários in-file linkando ao caveat de `output.md`.
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.7, NFR-RB-2_

  - [x] 6.2 Criar `.dockerignore` na raiz
    - Excluir: `node_modules`, `.next` (com `!.next/standalone`), `.env`, `.env.*` (com `!.env.example`), `.git`, `.gitignore`, `coverage`, `playwright-report`, `test-results`, `.kiro`, `docs/legacy`, `design`, `public/uploads`, `public/verification`, `.vscode`, `.claude`, `.agents`, `*.log`.
    - _Requirements: 8.4_

- [x] 7. Documentação operacional e de envvars
  - [x] 7.1 Criar `docs/deploy-railway.md`
    - Seções: Pré-requisitos, Provisionamento R2, Provisionamento Railway, Configuração de domínio (Registro.br + Cloudflare), Configuração de cron (2 schedulers), Atualização do `Webhook_MP_URL`, `Rollback_Plan`, Smoke checks pós-deploy, Pendências pré-go-live (blockers).
    - Tabela dos 2 schedulers Railway com `cron-expire-plans` (`0 6 * * *` UTC) e `cron-reset-hot` (`0 7 * * *` UTC), comando `curl -fsS -H "Authorization: Bearer $CRON_SECRET" $PRODUCTION_BASE_URL/api/cron/...`.
    - Nota explícita: NÃO usar `?secret=` (janela de transição encerra `2026-06-15T00:00:00Z`).
    - Blockers documentados: implementar Presigned_URL + bucket privado para `verification/*`; CSP enforcement; `npm audit`.
    - Smoke check de `docker build` + `docker run` com tempos esperados (≤ 5s boot, ≤ 10s `GET /` 200).
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 4.4, NFR-RB-1, NFR-RB-3, NFR-SEC-2, NFR-COST-1, NFR-COST-2, NFR-COST-3, NFR-DUR-3, NFR-PERF-2_

  - [x] 7.2 Mover `docs/deploy-vercel.md` para `docs/legacy/deploy-vercel.md`
    - Preservar histórico em `docs/legacy/` (pasta já existente).
    - _Requirements: 10.2_

  - [x] 7.3 Atualizar `.env.example` com bloco "Storage (Cloudflare R2 — produção)"
    - Adicionar 5 variáveis com comentários: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
    - Marcar como opcionais em dev (Storage_Local_Fallback ativo) e obrigatórias em produção (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` mínimas).
    - Não modificar nenhuma das envvars existentes.
    - _Requirements: 11.1, 11.2, 11.4_

  - [x] 7.4 Atualizar `docs/env.md` com as 5 envvars R2 e nota sobre fallback
    - Adicionar 5 linhas na tabela canônica (`Variable | Description | Example | Environment = prod`).
    - Adicionar nota na seção §"Notas" sobre `Storage_Local_Fallback` (ausência completa em dev = fallback; ausência em prod = throw com nome da envvar).
    - Não modificar entradas existentes.
    - _Requirements: 11.1, 11.3, 11.4_

  - [x] 7.5 Atualizar `CHANGELOG.md` em `[Unreleased]`
    - **Added**: `Storage_Module` (`src/lib/storage.ts`); `Dockerfile` multi-stage + `.dockerignore`; `output: "standalone"` em `next.config.ts`; `docs/deploy-railway.md`; 5 envvars R2 em `.env.example` e `docs/env.md`.
    - **Changed**: 5 sites de upload migrados de `mkdir + writeFile` para `Storage_Module`; `next.config.ts > images.remotePatterns` com entrada condicional R2; alvo de hospedagem Vercel → Railway; `docs/deploy-vercel.md` movido para `docs/legacy/deploy-vercel.md` (rationale: 1 linha).
    - _Requirements: 10.3, 10.2.1, 12.5_

  - [x] 7.6 Atualizar cross-refs em outros docs que apontavam para `docs/deploy-vercel.md`
    - Buscar (`grep "deploy-vercel"`) em `docs/`, ADRs, `README.md` se aplicável.
    - Substituir referências por `docs/deploy-railway.md` ou `docs/legacy/deploy-vercel.md` conforme contexto histórico.
    - _Requirements: 10.4_

- [x] 8. Final checkpoint — host-side gates antes do `docker build`
  - Rodar `npm run lint` (0 problems), `npx tsc --noEmit` (0 erros), `npm run test` (305+ verdes).
  - Smoke manual local: `docker build -t privello:smoke .` completa sem erros (incluindo `prisma generate` no estágio builder); `docker run -p 3000:3000 -e DATABASE_URL=$LOCAL_DB -e AUTH_SECRET=$(openssl rand -base64 32) privello:smoke` boota com `Storage_Local_Fallback` ativo (R2_* desativadas) e responde HTTP 200 em `GET /` em ≤ 10s.
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.5, 8.6, 8.7, 12.1, 12.2, 12.3, 12.4, NFR-PERF-2_

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP rápido (não as testes de propriedade do Storage_Module na primeira passada vão deixar Properties 1–6 sem cobertura mecânica — recomendado executar pelo menos 1.3, 1.5, 1.6 e 3.11 antes do go-live).
- Cada task referencia requirements granulares (sub-cláusulas, não apenas user stories).
- Property tests cobrem as 6 propriedades do design § "Correctness Properties"; cada propriedade é uma sub-task separada e annotada com seu número e os requirements que valida.
- Validações precedem `putObject` em todos os 5 sites (NFR-SEC-4 — Property 6 valida cross-site).
- `prisma/schema.prisma` é congelado nesta fase; nenhuma task altera o schema.
- Bytes em `public/uploads/` e `public/verification/` (seeds locais) **não** são migrados — banco de produção é virgem (Non-Goal 9 + 14).
- Schedulers Railway, provisionamento R2 e DNS Cloudflare são configuração **operacional manual** documentada em `docs/deploy-railway.md` (task 7.1) — não há código no repo para isto.
- Implementação de `Presigned_URL` + bucket privado para `verification/*` é **blocker pré-go-live** registrado em `docs/deploy-railway.md`, fora do escopo desta entrega.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2"] },
    { "id": 2, "tasks": ["1.3", "1.7", "3.1", "3.3", "3.5", "3.7", "3.9", "5.1", "6.1", "6.2", "7.2", "7.3", "7.4"] },
    { "id": 3, "tasks": ["1.4", "3.2", "3.4", "3.6", "3.8", "3.10", "5.2", "7.1"] },
    { "id": 4, "tasks": ["1.5", "3.11", "7.6"] },
    { "id": 5, "tasks": ["1.6"] },
    { "id": 6, "tasks": ["7.5"] }
  ]
}
```

## Workflow Completion

This workflow is complete — design and planning artifacts are now in place at `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\migracao-infra-producao\` (`requirements.md`, `design.md`, `tasks.md`).

You can begin executing tasks by:
- Opening `tasks.md`
- Clicking "Start task" next to task items

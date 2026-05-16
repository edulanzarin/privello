# Implementation Plan: `fase-1-seguranca`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas endurecem a superfície de segurança em sete frentes coordenadas: dev/cron, whitelist de imagens, validação Zod, rate limit, NextAuth produção, CSP/HSTS, e os documentos canônicos no diretório do spec-filho.

Restrições importantes:

- **Sem alterações em fluxos já cobertos pela auditoria.** Itens marcados ✅ no master `design.md > Estado de partida` (HMAC do webhook MP, headers básicos, validação de upload, services iniciais, índices Prisma) **não** entram nesta fase.
- **AGENTS_Rule é bloqueio duro.** As consultas a `node_modules/next/dist/docs/` para `images-config` e `headers` já estão registradas em `requirements.md > §4` e em `design.md > Overview > AGENTS_Rule`. Atualizações posteriores viram linhas adicionais; não se sobrescreve.
- **Sem testes nesta fase.** A fase consome a infraestrutura da `fase-2-testes` quando ela ficar `Done`. Verificações desta fase são manuais com evidência (curl, log, screenshot).
- **CSP via header estático em `Report-Only` primeiro**, sem nonce, sem `proxy.ts`. Justificativa em `design.md > AGENTS_Rule` (nonce-CSP força dynamic rendering em todas as rotas e conflita com Fase 3).

## Tasks

- [ ] 1. Endurecimento dos Dev_Endpoints
  - [x] 1.1 Criar `src/lib/security/dev-auth.ts`
    - Função `requireAdminOrToken(req)` que aceita: (a) header `Authorization: Bearer <DEV_ENDPOINT_TOKEN>` em comparação tempo-constante (`crypto.timingSafeEqual`); (b) sessão NextAuth com `role` em `{ADMIN, MODERATOR}`
    - Em produção sem credencial → response 404 (esconde existência)
    - Em dev sem credencial → response 401 com mensagem de orientação
    - Log estruturado de invocações bem-sucedidas com `{ ts, ip, mode, subject }`
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 1.2 Refactor `src/app/api/dev/reset/route.ts`
    - Substituir `if (NODE_ENV === "production") return 403` por `requireAdminOrToken(req)`
    - Manter exatamente as mesmas operações de `prisma.$transaction` em sucesso
    - _Requirements: 1.1_

  - [x] 1.3 Refactor `src/app/api/dev/activate-plans/route.ts`
    - Mesma substituição da 1.2
    - _Requirements: 1.1_

  - [x] 1.4 Adicionar `DEV_ENDPOINT_TOKEN` ao `.env.example`
    - Criar `.env.example` se não existir; adicionar a chave com comentário descrevendo o uso (apenas dev/staging)
    - _Requirements: 1.2_

- [ ] 2. Cron_Endpoints com segredo via header
  - [x] 2.1 Criar `src/lib/security/cron-auth.ts`
    - Função `verifyCronSecret(req, { transitionEndsAt })` que aceita: (a) `Authorization: Bearer <CRON_SECRET>`; (b) `X-Cron-Secret`; (c) `?secret=` (modo transição com warn estruturado); todas comparadas em tempo constante
    - Após `transitionEndsAt`, query string é rejeitada com 401
    - Sem corpo no 401
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Refactor `src/app/api/cron/expire-plans/route.ts`
    - Substituir leitura de `?secret=` por `verifyCronSecret(req, { transitionEndsAt })`
    - `transitionEndsAt` declarado como constante no commit, com comentário citando a data e o checklist de schedulers a atualizar antes
    - Manter exatamente as mesmas mutações em sucesso
    - _Requirements: 2.1_

  - [x] 2.3 Refactor `src/app/api/cron/reset-hot/route.ts`
    - Mesma substituição da 2.2
    - _Requirements: 2.1_

  - [x] 2.4 Atualizar `.env.example` com `CRON_SECRET`
    - Adicionar a chave com comentário descrevendo o uso (header preferido, query em transição)
    - _Requirements: 2.1_

- [ ] 3. Whitelist de `images.remotePatterns`
  - [x] 3.1 Inventariar hosts efetivamente usados pelo app
    - Buscar em `src/**` por `<Image src="https://...` e por strings `https://` que terminem em domínios externos
    - Listar hosts encontrados em `endpoints-zod.md` (seção dedicada "Imagens externas") com ocorrência (path:linha)
    - _Requirements: 3.2_

  - [x] 3.2 Editar `next.config.ts > images.remotePatterns`
    - Substituir o array atual por whitelist explícita: domínio próprio em produção (lido de `process.env.PRODUCTION_HOSTNAME`), `picsum.photos` (dev/seed), `commondatastorage.googleapis.com`, `storage.googleapis.com`, `*.googleusercontent.com`, e quaisquer outros confirmados em 3.1
    - **REMOVER** `{ protocol: "https", hostname: "**" }`
    - Comentário no arquivo cita: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md` + `node_modules/next/dist/shared/lib/image-config.d.ts:type RemotePattern`, com a data da consulta
    - _Requirements: 3.1, 3.3_

  - [x] 3.3 Validar build com a whitelist final
    - Rodar `npm run build` e confirmar zero falhas relacionadas a `next/image`
    - WHERE algum `<Image src>` usar host fora da whitelist, ou (a) adicionar à whitelist com justificativa, ou (b) trocar por host coberto, ou (c) registrar como `OutOfScopeFinding`
    - _Requirements: 3.4_

  - [x] 3.4 Atualizar `.env.example` com `PRODUCTION_HOSTNAME`
    - Adicionar a chave com exemplo (`privello.com.br` ou similar)
    - _Requirements: 3.2_

- [ ] 4. Validação Zod nos Public_Input_Endpoints
  - [x] 4.1 Adicionar `zod` em `package.json > dependencies`
    - Pinar versão atual estável (sem `^` ou `~`)
    - Validar `npm install` em ambiente limpo
    - _Requirements: 4.1_

  - [x] 4.2 Criar `src/lib/validation/index.ts` e schemas por endpoint
    - Para cada Public_Input_Endpoint identificado em 4.3, criar `src/lib/validation/<endpoint>.schema.ts` com `Schema` e `type X = z.infer<typeof Schema>`
    - Schemas mínimos previstos: `UploadBodySchema`, `WaClickBodySchema`, `ReviewBodySchema`, `SignupBodySchema`, schemas para Server Actions de perfil, financeiro, suporte
    - Re-export nomeado em `index.ts`
    - _Requirements: 4.4_

  - [x] 4.3 Inventariar Public_Input_Endpoints em `endpoints-zod.md`
    - Listar todas as Server Actions em `src/app/_actions/**` e `src/app/painel/_actions/**`
    - Listar todos os Route Handlers em `src/app/api/**` que recebem body ou query parametrizada
    - Para cada um, registrar (path do arquivo, função/handler, schema aplicado, formato do erro)
    - Documento vive em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\endpoints-zod.md`
    - _Requirements: 4.2_

  - [x] 4.4 Aplicar Zod em cada endpoint listado
    - Substituir validações manuais (`if (!body.x)` etc.) por `Schema.safeParse(rawBody)`
    - Em falha de Route Handler: 400 com `result.error.flatten()` formatado
    - Em falha de Server Action: objeto tipado `{ error, issues }`
    - _Requirements: 4.1, 4.3, 4.5_

- [ ] 5. Rate limiting
  - [x] 5.1 Criar `src/lib/rate-limit.ts` com store em memória
    - `interface RateLimiterStore` plugável com método `incr(key, windowSec)`
    - Implementação default: `Map<string, { count: number, resetAt: number }>` com cleanup periódico (`setInterval` com `unref()`)
    - Função `rateLimit(config, store?)` retornando `{ allowed, retryAfter?, remaining }`
    - Comentário deixando claro que store em memória **funciona apenas em single-instance**; multi-instance é `OutOfScopeFinding` para Fase 7
    - _Requirements: 5.3_

  - [x] 5.2 Criar `src/lib/rate-limit-config.ts` com tabela canônica
    - Constante `RATE_LIMIT_TABLE` com entradas para `login`, `upload`, `waClick`, `comment`, `storyView` (valores conforme `design.md > Data Models`)
    - Tipo derivado para uso em chamadas
    - _Requirements: 5.1, 5.2_

  - [x] 5.3 Replicar a tabela em `rate-limits.md`
    - Documento em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\rate-limits.md`
    - Tabela: Endpoint | Chave | Janela | Limite | Resposta ao exceder
    - _Requirements: 5.1, 5.2_

  - [x] 5.4 Aplicar rate limit em login (NextAuth)
    - Decidir mecanismo: callback NextAuth dedicado OU rota auxiliar em `src/app/api/auth/...`
    - Em excesso: 429 com `Retry-After`; log de auditoria com `{ ts, ip, attempt }`
    - _Requirements: 5.1, 5.4_

  - [x] 5.5 Aplicar rate limit em `/api/upload/route.ts`
    - Chave: `userId` da sessão; janela conforme tabela
    - Em excesso: 429 com mensagem; log de auditoria
    - Manter validação atual de Content-Length/MIME/tamanho intacta (item ✅ resolvido — não vira tarefa)
    - _Requirements: 5.1, 5.4_

  - [x] 5.6 Aplicar rate limit em `/api/wa-click/route.ts`
    - Chave: `profileId+IP`; janela conforme tabela
    - Em excesso: **200 silencioso** (sem registrar o clique, sem revelar limite)
    - _Requirements: 5.1_

  - [x] 5.7 Aplicar rate limit em endpoints de comentários
    - Localizar Route Handlers e Server Actions de comentários (mídia comentários, story comentários)
    - Chave: `userId`; janela conforme tabela
    - Em excesso: 429 com mensagem; log de auditoria
    - _Requirements: 5.1, 5.4_

  - [x] 5.8 Aplicar rate limit em endpoints de visualização de stories
    - Localizar endpoint de "view" de stories
    - Chave: `userId+storyId`; janela conforme tabela; comportamento idempotente (200 silencioso após primeira visualização na janela)
    - _Requirements: 5.1_

- [ ] 6. NextAuth produção
  - [x] 6.1 Refactor `src/lib/auth.ts`
    - `trustHost` condicional: em produção, aceita request apenas se `req.origin === process.env.AUTH_URL`; em dev, mantém `trustHost: true`
    - Falhar build/start em produção quando `AUTH_URL` não definido
    - _Requirements: 6.2_

  - [x] 6.2 Atualizar `.env.example` com `AUTH_URL`
    - Adicionar a chave com comentário descrevendo o uso (URL pública do app em produção)
    - _Requirements: 6.3_

  - [x] 6.3 Criar `nextauth-prod.md` em `.kiro/specs/fase-1-seguranca/`
    - Passo a passo de configuração em produção (Vercel/Docker): definir `AUTH_URL`, gerar `AUTH_SECRET`, validar com `curl /api/auth/session`
    - Apontar para o documento a partir do README na entrega da Fase 7 (registrar como dependência cruzada)
    - _Requirements: 6.4_

- [ ] 7. CSP e HSTS via headers estáticos
  - [x] 7.1 Inventariar origens reais usadas pelo app
    - Levantar origens de scripts, estilos, imagens, fontes, conexões fetch, frames usadas em prod
    - Resultado: lista por diretiva CSP (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `font-src`, `media-src`, `frame-ancestors`)
    - Aceitar `'unsafe-inline'` em script-src e style-src nesta fase (decisão do design); registrar em comentário no `next.config.ts`
    - _Requirements: 7.2_

  - [x] 7.2 Editar `next.config.ts > async headers()` para adicionar CSP-Report-Only
    - Adicionar header `Content-Security-Policy-Report-Only` com a string CSP construída em 7.1
    - Aplicar em `source: "/(.*)"`
    - Comentário no arquivo cita: `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` + `headers.md`, com a data da consulta
    - _Requirements: 7.1, 7.2_

  - [x] 7.3 Adicionar HSTS direto
    - No mesmo bloco `securityHeaders`, adicionar `{ key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" }` (180 dias, sem `preload`)
    - _Requirements: 7.4_

  - [x] 7.4 Preservar headers existentes
    - X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control continuam intactos
    - Modificar qualquer um deles vira `OutOfScopeFinding`
    - _Requirements: 7.5_

  - [x] 7.5 Declarar janela de validação para transição Report-Only → enforcement
    - Documentar em `nextauth-prod.md` (ou doc dedicado `csp-rollout.md`): janela mínima de 7 dias em produção, critério de transição (zero violações reportadas), procedimento de reversão
    - **NÃO transitar nesta fase** — a fase entrega CSP em modo Report-Only; a transição para `Content-Security-Policy` enforcement é commit posterior, fora do escopo desta entrega imediata
    - _Requirements: 7.3_

- [ ] 8. Saída da fase
  - [~] 8.1 Validar saída
    - Todos os 8 Requirements de `requirements.md` têm evidência (path:linha de código, log de teste manual, ou link de PR) anexada
    - Seção §4 (AGENTS_Rule) de `requirements.md` tem linha preenchida para `images-config` e `headers` (já preenchidas; confirmar que continuam coerentes com o que foi efetivamente entregue)
    - Seção §3 (`OutOfScopeFinding`) está vazia ou cada linha aponta commit no master spec
    - Documentos `endpoints-zod.md`, `rate-limits.md`, `nextauth-prod.md` e (se aplicável) `csp-rollout.md` existem e estão preenchidos
    - _Requirements: 8.2_

  - [~] 8.2 Atualizar Phase Card no master `requirements.md`
    - `state: InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601
    - Manter `child_spec_path` apontando para esta pasta
    - Re-rodar Spawn-Readiness Gate em `fase-3-backend` e `fase-7-dx-infra` (dependentes diretas)
    - _Requirements: 8.2_

- [ ] 9. Property tests pós-Fase 2 (condicional)
  - Pré-condição: `fase-2-testes` em `state: Done`. Enquanto não estiver, esta seção fica `Blocked` no Phase Card desta fase, e a Fase 1 pode ser entregue como `Done` parcial cobrindo só os blocos 1–8 (verificação manual). As Properties enunciadas em `design.md > Correctness Properties` viram `*.pbt.ts` aqui.

  - [x] 9.1 * Implementar `src/lib/rate-limit.pbt.ts`
    - Property 1 (limit dentro da janela): `fc.string()` para chave, `fc.integer({ min: 1, max: 60 })` para `windowSec`, `fc.integer({ min: 1, max: 100 })` para `limit`; tempo via `vi.useFakeTimers()`
    - Property 2 (independência entre chaves): mesmo gerador com par `(k1, k2)` distinto
    - Property 3 (reset após janela): mesma config, avançar tempo via `vi.advanceTimersByTime((windowSec + 1) * 1000)`
    - _Requirements: 5.1, 5.2_
    - _Validates: Property 1, Property 2, Property 3_

  - [x] 9.2 * Implementar `src/lib/validation/<schemas>.pbt.ts` (idempotência)
    - Property 4 (idempotência de `parse`): para cada schema listado em `endpoints-zod.md`, gerador derivado via `fc.record(...)`; assertiva `S.parse(S.parse(v))` estruturalmente igual a `S.parse(v)`
    - Pode ser um único arquivo `validation.pbt.ts` consumindo a lista por `describe.each`
    - _Requirements: 4.1, 4.5_
    - _Validates: Property 4_

  - [x] 9.3 * Implementar `src/lib/security/cron-auth.pbt.ts`
    - Property 5 (três caminhos durante a janela): gerador de header (Authorization, X-Cron-Secret, query-only); assertivas separadas por caminho
    - Property 6 (rejeição após `transitionEndsAt`): `vi.useFakeTimers()` + `vi.setSystemTime(transitionEndsAt + 1ms)`; assertiva de rejeição quando query é a única fonte
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
    - _Validates: Property 5, Property 6_

  - [x] 9.4 * Implementar `src/lib/security/dev-auth.pbt.ts`
    - Property 7 (404 em produção sem credencial): mockar `process.env.NODE_ENV = "production"`; gerador de request sem credencial
    - Property 8 (401 em dev com mensagem não-vazia): mockar `process.env.NODE_ENV !== "production"`
    - _Requirements: 1.2, 1.3, 1.4_
    - _Validates: Property 7, Property 8_

## Notes

- Tarefas marcadas com `*` (9.1–9.4) entregam testes baseados em propriedade conforme as Properties declaradas em `design.md > Correctness Properties`. Elas dependem de `fase-2-testes` estar `Done` (Vitest + fast-check disponíveis); enquanto não estiver, ficam `Blocked` no Phase Card.
- Tarefas que tocam o mesmo arquivo (`.env.example` em 1.4, 2.4, 3.4, 6.2; `next.config.ts` em 3.2, 7.2, 7.3) ficam em ondas distintas para evitar conflito de edição.
- A tarefa 7.5 deixa explícito que a transição CSP Report-Only → enforcement **NÃO** acontece nesta fase.
- Toda alteração em endpoint que aceite input externo deve ser acompanhada da entrada correspondente em `endpoints-zod.md` (regra dura desta fase).
- Itens marcados ✅ em `design.md > Estado de partida` do master (HMAC do webhook MP, validação de upload existente, headers básicos já aplicados) NÃO viram tarefa aqui.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "4.3", "5.1", "6.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "3.2", "4.2", "5.2", "6.2"] },
    { "id": 2, "tasks": ["1.4", "3.3", "5.3", "6.3"] },
    { "id": 3, "tasks": ["2.4", "3.4"] },
    { "id": 4, "tasks": ["4.4"] },
    { "id": 5, "tasks": ["5.4", "5.5", "5.6", "5.7", "5.8"] },
    { "id": 6, "tasks": ["7.2"] },
    { "id": 7, "tasks": ["7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5"] },
    { "id": 9, "tasks": ["8.1"] },
    { "id": 10, "tasks": ["8.2"] },
    { "id": 11, "tasks": ["9.1", "9.2", "9.3", "9.4"] }
  ]
}
```

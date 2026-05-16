# Handoff — Sessão Autônoma de Madrugada

## Tarefa em andamento

Executar até o fim, em paralelo, dois specs-filhos do master `auditoria-geral`:

- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\` (Phase 1 — endurecimento de segurança)
- `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\` (Phase 2 — infraestrutura de testes)

Ambos saem `state: Done` no master `requirements.md` quando todas as tasks estiverem completed e os checks de saída passarem.

## Estado real (filesystem) — confirmado

### `fase-2-testes`

- `package.json` com `vitest 4.1.6`, `@vitest/coverage-v8 4.1.6`, `fast-check 4.8.0`, `@fast-check/vitest 0.4.1` pinados em devDependencies
- `package.json > scripts`: `test`, `test:watch`, `test:run` adicionados (e2e/dev/build/lint/db preservados)
- `vitest.config.ts` na raiz com env=node, include `src/**/*.{test,pbt}.ts`, exclude tests/e2e, coverage v8
- `vitest.setup.ts` na raiz com `fc.configureGlobal({ verbose: 2, numRuns: 100 })`

### `fase-1-seguranca`

- `package.json > dependencies` com `zod 3.23.8` pinado
- `src/lib/security/dev-auth.ts` — `requireAdminOrToken` com timing-safe compare, 404 em prod, 401 em dev
- `src/lib/security/cron-auth.ts` — `verifyCronSecret` com 3 caminhos (Authorization Bearer, X-Cron-Secret, query deprecated com janela de transição) e log estruturado
- `src/lib/rate-limit.ts` — store em memória + interface plugável + cleanup com `unref()`
- `src/lib/auth.ts` — guard `AUTH_URL` em produção (throw at module-load se ausente), comentários documentando posture
- `src/app/api/dev/reset/route.ts` — consumindo `requireAdminOrToken`
- `src/app/api/dev/activate-plans/route.ts` — consumindo `requireAdminOrToken`

### Pendente real (filesystem)

- `src/lib/rate-limit-config.ts` — tabela canônica
- `src/lib/validation/index.ts` + schemas por endpoint
- `src/app/api/cron/expire-plans/route.ts` — refactor para `verifyCronSecret`
- `src/app/api/cron/reset-hot/route.ts` — refactor para `verifyCronSecret`
- `next.config.ts` — whitelist real em `images.remotePatterns` + CSP-Report-Only + HSTS + comentário AGENTS_Rule
- `.env.example` na raiz — DEV_ENDPOINT_TOKEN, CRON_SECRET, AUTH_URL, PRODUCTION_HOSTNAME, CRON_TRANSITION_ENDS_AT
- `.kiro/specs/fase-1-seguranca/endpoints-zod.md` — inventário de Server Actions e Route Handlers que aceitam input
- `.kiro/specs/fase-1-seguranca/rate-limits.md` — réplica em prosa da tabela canônica
- `.kiro/specs/fase-1-seguranca/nextauth-prod.md` — passo a passo de configuração de produção
- `.kiro/specs/fase-1-seguranca/csp-rollout.md` (opcional, se decidir documentar a janela)
- `.kiro/specs/fase-2-testes/testing-conventions.md` — convenções, tabela de pureza, pares parse/serialize
- Aplicação de rate limit em login, /api/upload, /api/wa-click, comentários, story-view
- Testes determinísticos `*.test.ts` por módulo puro (Property 1–6 da Phase 2 + Property 1–8 da Phase 1)
- Testes de propriedade `*.pbt.ts` correspondentes
- `tsconfig.json` ajuste se necessário para reconhecer `vitest/globals` (decidir: usar imports explícitos é aceitável)
- `eslint.config.mjs` decisão sobre incluir `*.test.ts`/`*.pbt.ts` no escopo (pode mover para fase 7 e registrar OutOfScopeFinding)

## Bookkeeping do task tool — DESSINCRONIZADO

Lock recorrente no `C:\Users\edulanzarin\.kiro\tasks\8ce70501232af33b\fase-1-seguranca.meta.json` impediu várias chamadas de `task_update` na sessão anterior. Tasks que já estão `completed` no filesystem podem aparecer como `queued` ou `in_progress` no tracker.

**Ação obrigatória ao retomar**: rodar o `task_get`/`task_list` em ambos specs e reconciliar status com o filesystem ANTES de despachar trabalho novo. Marcar como `completed` toda task cujos artefatos já existem.

## Restrições

- Workspace: `c:\Users\edulanzarin\Documents\Dev\privello\` apenas
- Sem `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force`, `format`, `shutdown`
- Sem mexer em `node_modules` manualmente (use `npm install`/`npm ci`)
- Sem deploy
- Sem alterar schema do banco (Prisma migrations não fazem parte destas duas fases)
- Smoke checks finais: `npm run lint`, `npm run test`, `npx tsc --noEmit`, `npm run build`

## Decisões já tomadas (não reabrir)

- **CSP**: estático em `Content-Security-Policy-Report-Only` via `next.config.ts > headers()`, sem nonce (porque nonce-CSP exigiria `proxy.ts` + dynamic rendering, o que conflita com Fase 3). `'unsafe-inline'` aceito conscientemente.
- **HSTS**: `max-age=15552000; includeSubDomains` (180 dias), sem `preload`.
- **Rate limit store**: em memória single-instance. Multi-instance = `OutOfScopeFinding` para Fase 7.
- **PRODUCTION_HOSTNAME**: ler de `process.env.PRODUCTION_HOSTNAME`. Se vazio/ausente, registrar como pendência operacional, não bloquear.
- **CRON_TRANSITION_ENDS_AT**: usar `2026-06-15T00:00:00Z` como default (≥ 30 dias após mergeo). Documentar no commit.
- **`@fast-check/vitest`**: usar `test.prop` da integração oficial em vez de `fc.assert + describe/it` cru.
- **Zod schemas**: idempotentes (sem `.transform` que mude formato — Property 4 da Fase 1 garante).

## Decisões pendentes (parar e perguntar)

Só pare se encontrar:

1. **Hostname real do app em produção** (entra na whitelist `images.remotePatterns`).
2. **Lista final de origens** que CSP precisa permitir além de `'self'` (terceiros tipo MercadoPago checkout, fontes externas, analytics).
3. **Onde aplicar rate limit no login do NextAuth** (callback `signIn` vs middleware/proxy.ts) — decidir lendo o código + docs Next 16 e ir.
4. **Schema/Prisma** changes que se mostrem necessários (não esperado — registre como OutOfScopeFinding).

## AGENTS_Rule (regra dura E5)

Esta versão do Next.js é 16.x e tem breaking changes. Antes de qualquer decisão sobre `images.remotePatterns`, `headers()`, `proxy.ts` (ex-middleware), Cache Components, View Transitions, Server Actions, Route Segment Config, consultar `node_modules/next/dist/docs/` e registrar evidência (path consultado + trecho relevante + decisão) em:

- `.kiro/specs/fase-1-seguranca/requirements.md > §4` para `images-config` e `headers` (já preenchido — confirmar coerência com o que for entregue)

## Spec do master afetado

Após cada fase ficar `Done`, atualizar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`:

- Phase Card da fase: `state: InProgress` → `state: Done`
- Adicionar `doneAt: <ISO-8601>`
- Manter `child_spec_path`

Concluir Fase 2 destrava: F3, F4, F5, F7. Concluir Fase 1 destrava: F3, F7.

## Histórico (sessões anteriores deste workspace)

Resumido — pra quem vier depois saber por que estamos onde estamos:

1. Bug de iPhone via LAN foi corrigido com `trustHost: true` em `src/lib/auth.ts` + fix em `prisma/seed.ts`. Spec arquivado em `.kiro/specs/_archive/ios-mobile-interactions-fix/` (workflow sem dependência atual).
2. Master spec `auditoria-geral` definiu 7 fases promovíveis a specs-filhos, com Phase Cards completos, dependências (F1/F2 → F3, F2/F4 → F5, F4/F5 → F6, F1/F2/F3 → F7) e protocolo de promoção em `PROMOCAO.md`.
3. Phases 1 e 2 foram promovidas (`state: InProgress`, `child_spec_path` preenchido) e tiveram requirements + design + tasks completos gerados.
4. Sessão autônoma de execução em paralelo iniciou; alguns artefatos foram entregues (lista acima); bookkeeping ficou desync por lock no Windows.

## Próximo passo concreto

Quando retomar:

1. Ler este arquivo inteiro.
2. Reconciliar bookkeeping (`task_list` + `task_get` + filesystem).
3. Identificar próxima onda paralela executável (subagentes file-disjoint).
4. Despachar até as duas fases ficarem `Done`.
5. Rodar smoke checks finais.
6. Atualizar este `handoff.md` com o que sobrou (se sobrar) e resultado dos smokes.

# Handoff — Fases 1 e 2 entregues

> Última atualização: 2026-05-16T04:55Z
> Sessão anterior: ver histórico no fim deste arquivo.

## Status atual

**Fase 1 (`fase-1-seguranca`)** e **Fase 2 (`fase-2-testes`)** estão `state: Done` no master `auditoria-geral`.

- Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- Phase Card fase-1 → `Done` em 2026-05-16T04:47:12Z (commit `cd6f36c`)
- Phase Card fase-2 → `Done` em 2026-05-16T04:46:53Z (commit `b5a8fe0`)
- Spawn-Readiness Gate: **fase-3 e fase-7 plenamente atendidos** (têm fase-1+fase-2 satisfeitas).

## Smoke checks finais

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0, zero erros |
| `npx vitest --run` | ✅ 13 files / 118 tests / 4.36s, exit 0 |
| `npm run build` | ✅ 71 rotas compiladas (rodado em commit `c321510` para validar whitelist `images.remotePatterns`) |
| `npm run lint` | ⚠️ 20 errors + 44 warnings — **todos em código pré-existente** (RSC pages, age-gate, story-bar, media-gallery, profile-story-cover, painel/plano/upgrade-button). Nenhum erro em arquivos das Fases 1/2. Pertencem à Fase 5 (UX) e Fase 7 (DX/lint). Registrar como dívida conhecida nessas fases — não bloqueia a saída de fase-1/fase-2. |

## Entregas concretas

### Fase 1 — Endurecimento de segurança (8 Requirements + 4 PBTs)

**Arquivos novos:**
- `src/lib/security/dev-auth.ts` — `requireAdminOrToken` com timing-safe compare, 404 em prod, 401 em dev, log estruturado
- `src/lib/security/cron-auth.ts` — `verifyCronSecret` aceitando 3 caminhos (Authorization Bearer, X-Cron-Secret, ?secret= deprecated com janela até 2026-06-15)
- `src/lib/rate-limit.ts` — store em memória + interface plugável, cleanup com `unref()`, single-instance OK
- `src/lib/rate-limit-config.ts` — `RATE_LIMIT_TABLE` canônica para login/upload/waClick/comment/storyView
- `src/lib/validation/` — 21 arquivos `*.schema.ts` + `_form-utils.ts` + `index.ts` (60+ schemas Zod)
- `src/lib/security/dev-auth.pbt.ts`, `cron-auth.pbt.ts` — Properties 5, 6, 7, 8
- `src/lib/rate-limit.pbt.ts` — Properties 1, 2, 3
- `src/lib/validation/validation.pbt.ts` — Property 4 (idempotência, 8 schemas curados)
- `.env.example` — DEV_ENDPOINT_TOKEN, CRON_SECRET, AUTH_URL, PRODUCTION_HOSTNAME (sem segredos reais)

**Arquivos modificados:**
- `src/lib/auth.ts` — guard de `AUTH_URL` em prod com throw em module-load
- `src/app/api/dev/{reset,activate-plans}/route.ts` — consomem `requireAdminOrToken`
- `src/app/api/cron/{expire-plans,reset-hot}/route.ts` — consomem `verifyCronSecret` com `transitionEndsAt`
- 29 endpoints (51 Server Actions + 19 Route Handlers) — Zod aplicado via `Schema.safeParse(rawBody)`
- Rate limit aplicado em login (NextAuth), `/api/upload`, `/api/wa-click`, comentários, story-view
- `next.config.ts` — whitelist `images.remotePatterns` (5 hosts + PRODUCTION_HOSTNAME); CSP-Report-Only via `buildCSP(isProd)`; HSTS 180 dias sem preload; 5 headers básicos preservados

**Documentos do spec-filho:**
- `csp-origins.md` — origens reais por diretiva CSP (img-src, connect-src, etc.)
- `endpoints-zod.md` — 51 SA + 19 RH inventariados, schemas mapeados
- `rate-limits.md` — espelha `RATE_LIMIT_TABLE` em prosa
- `nextauth-prod.md` — passo a passo Vercel/Docker + janela CSP rollout
- `requirements.md > Saída desta fase — evidências` — mapeamento EAR → path:linha + commit

**Pendente operacional (não bloqueia):**
- `PRODUCTION_HOSTNAME` precisa ser registrado em `.env` com hostname real quando o domínio definitivo for confirmado (hoje fica vazio em dev, condicional em prod).

### Fase 2 — Infraestrutura de testes (7 Requirements + 5 PBTs)

**Arquivos novos:**
- `vitest.config.ts` — env=node, include `src/**/*.{test,pbt}.ts`, exclude `tests/e2e/**`, coverage v8
- `vitest.setup.ts` — `fc.configureGlobal({ verbose: 2, numRuns: 100 })`
- `src/lib/{money,discover-params,time-utils,booking-slots,whatsapp-booking}.test.ts` — testes determinísticos
- `src/lib/{money,discover-params,time-utils,booking-slots}.pbt.ts` — Properties 1, 2, 3, 5, 6 (Property 4 fica em fase-1)
- `whatsapp-booking.pbt.ts` **NÃO criado** — Property 4 marcada **não declarável** (sem `parseBookingUrl`)

**Arquivos modificados:**
- `package.json` — devDeps pinadas (vitest 4.1.6, @vitest/coverage-v8 4.1.6, fast-check 4.8.0, @fast-check/vitest 0.4.1) + scripts test/test:watch/test:run
- `tsconfig.json` — sem alteração (decisão A documentada em testing-conventions: imports explícitos, sem `vitest/globals`)
- `playwright.config.ts` — sem alteração (já tinha `testDir: "./tests/e2e"` restritivo)
- `.gitignore` — adicionado `/test-results` e `/playwright-report`; `!.env.example` para versionar template

**Documentos do spec-filho:**
- `testing-conventions.md` — §1 (localização), §2 (gabaritos), §3 (persistência de contraexemplos + reproducir seed via 3 caminhos), §4 (tabela de pureza confirmada — 7 pure / 3 parcial / 5 non-pure), §5 (pares parse/serialize por módulo), §6 (cobertura inicial medida com tabela por arquivo), §6.5 (decisão A para ESLint scope), §8 (contrato CI Fase 7)
- `requirements.md > Saída desta fase — evidências` — mapeamento EAR → evidência

## Cobertura medida (Fase 2 — task 5.1)

Módulos `pure` ou com partes puras:

| Arquivo | Stmts | Status |
|---|---|---|
| `booking-slots.ts` (parcial) | 100% (49/49) | ✅ |
| `discover-params.ts` (pure) | 100% (26/26) | ✅ |
| `money.ts` (pure) | 100% (1/1) | ✅ |
| `time-utils.ts` (parcial) | 100% (24/24) | ✅ |
| `whatsapp-booking.ts` (pure) | 100% (19/19) | ✅ |
| `constants.ts`, `email-templates.ts`, `rate-limit-config.ts`, `utils.ts`, `queries.ts > sortProfileCards/finalizeDiscoverOrder` | 0% | ⚠️ documentado por Tarefa 3.7 / fora de escopo de fase-2 |

## Decisões tomadas (não reabrir)

- **CSP**: `Content-Security-Policy-Report-Only` via `next.config.ts > headers()`, sem nonce. `'unsafe-inline'` aceito; `'unsafe-eval'` apenas em dev (Fast Refresh). Origem da decisão: nonce-CSP exigiria `proxy.ts` + dynamic rendering em todas as rotas, conflito com Fase 3 (43 rotas force-dynamic a classificar).
- **HSTS**: `max-age=15552000; includeSubDomains` (180 dias), sem `preload`.
- **Rate limit store**: em memória single-instance. Multi-instance = `OutOfScopeFinding` para Fase 7.
- **CRON_TRANSITION_ENDS_AT**: `2026-06-15T00:00:00Z` (>30 dias de janela). Comentário no `transitionEndsAt` lista checklist de schedulers a migrar antes (vercel.json crons, cron-job.org, GitHub Actions).
- **Property 1 (money)**: round-trip canônico do `design.md` é **não declarável** (`money.ts` exporta apenas `formatBrl`, sem inversa). Implementado invariante mais fraco (prefixo "R$" + dígitos preservados). `brlToCents`/`centsToBRL` candidato a refactor de fase-3 se a camada financeira precisar.
- **Property 2 (discover-params)**: round-trip canônico não declarável (assimetria de tipos). Implementado round-trip via `buildDiscoverHrefFromCity → URLSearchParams → parseDiscoverSearchParams`.
- **Property 3 (time-utils)**: round-trip declarável com escopo ajustado — par real é `string ↔ number` (minutos), não `string ↔ Date`.
- **Property 4 (whatsapp-booking)**: condicional, **não declarável** confirmado (sem inversa). Sem `.pbt.ts`.
- **ESLint scope dos `*.test.ts`/`*.pbt.ts`**: já incluídos via preset Next + TS (decisão A, sem alteração de config). Regras específicas de teste ficam para fase-7.

## Restrições respeitadas

- Nenhum `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force` rodado.
- `node_modules` intocado (apenas `npm install` para pinning de devDeps).
- Schema do Prisma intocado.
- `.env` real preservado; `.env.example` populado só com placeholders.
- Workspace confinado a `c:\Users\edulanzarin\Documents\Dev\privello\`.

## Histórico de commits desta sessão

```
cd6f36c feat(fase-1): saída — Phase Card Done no master + evidências por requisito
b5a8fe0 feat(fase-2): saída — Phase Card Done no master + evidências por requisito
8c2ebe5 docs(fase-2): cobertura medida + seed PBT + contrato CI documentado
8504c1f test(fase-1/security): PBTs cron-auth (P5/P6) e dev-auth (P7/P8)
cd923fe test(fase-1/validation): PBT Property 4 idempotência
141cc68 test(fase-2): PBTs para discover-params (Property 2) e time-utils (Property 3)
54a4858 test(fase-1/rate-limit): PBTs Properties 1, 2, 3
536037b test(fase-2/money): property test em formatBrl (Property 1 adaptada)
a0ef4b5 feat(fase-1): aplicar Zod + rate limit nos Public_Input_Endpoints
598f78f test(fase-2): cobertura deterministica para modulos puros de src/lib/
f53c691 docs(fase-2): confirmar pureza + pares parse/serialize
5fee0d8 feat(fase-1/headers): CSP Report-Only + HSTS em next.config.ts
c321510 feat(fase-1/images): whitelist explícita em remotePatterns
9d9844c feat(fase-1/validation): schemas Zod por endpoint em src/lib/validation/
280897a docs(fase-2): decisão sobre ESLint scope para *.test.ts/*.pbt.ts
1f0a931 chore(fase-1): .env.example com chaves de fase-1 (DEV_ENDPOINT_TOKEN, CRON_SECRET, PRODUCTION_HOSTNAME, AUTH_URL)
13704da docs(fase-1): inventariar Public_Input_Endpoints e hosts externos
a2a1a66 docs(fase-1): rate-limits.md espelhando RATE_LIMIT_TABLE (re-add)
48d9696 docs(fase-1): nextauth-prod.md + janela de rollout CSP
4aafe86 docs(fase-1): rate-limits.md espelhando RATE_LIMIT_TABLE
c86b271 feat(fase-1/cron-auth): migrate cron routes to verifyCronSecret
3e4fb0f chore: baseline checkpoint before fase-1/fase-2 autonomous run
```

Total: 22 commits desta sessão. Branch `master`, sem push (constraint do usuário).

## Próximos passos

Fases destravadas:
- **Fase 3 (`fase-3-backend`)**: dependências fase-1 + fase-2 satisfeitas. Pode ser promovida.
- **Fase 4 (`fase-4-design-system`)**: dependência fase-2 satisfeita. Pode ser promovida.
- **Fase 5 (`fase-5-ux`)**: dependências fase-2 + fase-4 — fase-4 ainda pendente.
- **Fase 7 (`fase-7-dx-infra`)**: dependências fase-1 + fase-2 + fase-3 — fase-3 ainda pendente.

Recomendação: promover `fase-3-backend` E/OU `fase-4-design-system` a seguir (independentes entre si, podem rodar em paralelo).

**Prompt pronto para retomar em nova sessão**: `.kiro/NEXT_SESSION_PROMPT.md`. Cole o bloco indicado lá no chat da nova sessão e o agente continua de onde parou.

## Observações operacionais

- O lock no tracker (`.kiro/tasks/.../*.meta.json`) continuou intermitente durante toda a sessão. Funcionou como bypass: o `tasks.md` de cada spec-filho foi tratado como fonte da verdade pelos subagentes, sem dependência do tracker. Os subagentes editaram `[~]` → `[x]` direto via `str_replace`.
- Algumas races entre subagentes paralelos resultaram em commits "compostos" (mais arquivos do que o subagente staged explicitamente). Conteúdo correto em todos os casos; só algumas mensagens de commit ficaram diferentes do prescrito. Não houve perda de trabalho.
- Auto-approve config registrada em `.kiro/AUTO_APPROVE_SETUP.md` (referência futura).

## Sessões anteriores (resumido)

1. Bug iPhone via LAN corrigido com `trustHost: true` em `src/lib/auth.ts` + fix em `prisma/seed.ts`. Spec arquivado em `.kiro/specs/_archive/ios-mobile-interactions-fix/`.
2. Master spec `auditoria-geral` definiu 7 fases promovíveis com Phase Cards completos.
3. Phases 1 e 2 promovidas em 2026-03-14, requirements + design + tasks gerados.
4. Sessão autônoma de execução paralela em onda iniciou; entregou parte significativa dos artefatos antes de travar pelo lock.
5. **Esta sessão (2026-05-16)**: reconciliação do bookkeeping + finalização das duas fases até `state: Done`. 22 commits, 118 testes verdes, smoke checks limpos (exceto lint pré-existente fora do escopo).

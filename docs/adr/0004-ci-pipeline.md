# ADR 0004 — Pipeline de CI com 3 estágios e tolerância de lint herdado

- **Status**: Aceito
- **Data**: 2026-05-16

## Contexto

Antes desta fase, o repositório **não tinha CI configurada**. `Test-Path .github`
retornava `False` em 2026-05-17 — nenhum YAML em `.github/workflows/`, `.gitlab-ci/`,
`.circleci/` ou similar. Isso significa que regressões de lint, type-check e testes
unitários só eram detectadas quando o dev rodava localmente.

A fase-2-testes (`testing-conventions.md > §8`) e a fase-4-design-system
(`tokens.md > Contrato com a CI da Fase 7`) declararam contratos explícitos com a
pipeline de CI a ser entregue pela fase-7-dx-infra:

- Fase 2: `npm run test` é executável em CI sem banco e sem rede em ≤ 60 s
  (medido em ~5 s com 172 testes).
- Fase 4: `npm run lint` consome a regra anti-regressão `no-restricted-syntax` que
  cobre `src/components/**` e `src/app/**` (impede regressão para hex literais e
  font-size arbitrário).

O lint herdado tem **~20–28 errors** em código de UX/painel pertencente à fase-5-ux
(`react-hooks/refs`, `react-hooks/cant-call-impure-fn-during-render`, `setState-in-effect`,
`react/no-children-prop` em `*.pbt.ts`). Esses errors **não pertencem ao escopo da fase-7** —
correção pertence à fase-5. A fase-7 só configura a CI; não corrige código de aplicação.

Alternativas para tolerância do lint herdado consideradas:

- **Opção A — bloquear**: CI vermelha até a fase-5 corrigir. Sustentável apenas se a
  fase-5 estiver rodando em paralelo e os errors caírem rapidamente.
- **Opção B — `continue-on-error: true` no step de lint**: lint roda mas não bloqueia
  merge. Sustentável a curto prazo; perde gate semântico.
- **Opção C — lint apenas em arquivos modificados pelo PR**: usar
  `git diff --name-only origin/master...HEAD | grep ts/tsx | xargs eslint --max-warnings 0`.
  Mantém gate em código novo. Complexidade YAML alta (precisa de `git fetch`, parsing
  de diff, tratamento de PRs sem base remota).

## Decisão

Adotamos **GitHub Actions** como provedor de CI (alinhado com `git remote` apontando
para GitHub). Pipeline em arquivo único `.github/workflows/ci.yml` com:

- **1 job + N steps** (em vez de N jobs paralelos): evita 90–180 s de cold-start de
  `npm ci` por job. Com 1 job, `node_modules` é setado uma vez e reaproveitado.
- **Triggers**: `push` em `master`/`main` e `pull_request` em `master`/`main`.
- **Steps**:
  1. `actions/checkout@v4`.
  2. `actions/setup-node@v4` com `cache: 'npm'` e `node-version-file: 'package.json'`
     (lê `engines.node`, declarado nesta fase como `">=20.0.0"`).
  3. `npm ci` (preserva pinning estrito de `package-lock.json`).
  4. `npm run lint` com **`continue-on-error: true`** (Opção B).
  5. `npx tsc --noEmit` (bloqueante).
  6. `npm run test` (bloqueante; `CI=true` ativa modo CI do Vitest).
- **Timeout**: `timeout-minutes: 15` (margem confortável sobre baseline de ~130 s).
- **Sem `npm run build`** na CI desta fase: `next build` exige `AUTH_URL` em prod-mode
  e configurar segredo no Actions é trabalho da fase-1 ou de spec futuro de "deploy CI".

Justificativa para Opção B em vez de C:

- Opção C exige lógica de YAML não trivial (`git fetch origin master`, parsing do diff,
  passagem dos arquivos para `eslint --max-warnings 0`, tratamento de PRs sem base
  remota). A complexidade extra não compensa o ganho enquanto a fase-5 estiver ativa.
- Opção B mantém o gate de lint como **sinal observável** (a CI mostra os errors no
  log) sem bloquear o merge. Tipos e testes seguem bloqueantes — não há regressão
  silenciosa de tipo nem de teste.

Justificativa para `engines.node: ">=20.0.0"` (e não fixar uma versão LTS específica):

- Node 20 é a LTS mínima ainda em manutenção em 2026-05. Permitir 22 (próxima LTS)
  e 24+ evita PR de upgrade do Node como bloqueio. Garante que dev local e CI usam
  a mesma versão (LTS atual no momento do `npm ci`).

## Consequências

### Positivas

- Gate semântico de tipo e teste em todo PR.
- Tempo de execução curto após warm-up do cache de `~/.npm` (10–20 s para `npm ci`).
- Lint visível no log da CI sem bloquear merges enquanto a fase-5 corrige os errors herdados.
- Compatível com NextAuth v5 (testes usam `vi.stubEnv`, não dependem de `AUTH_URL`).

### Negativas

- Lint pode ficar vermelho como sinal observável até a fase-5 corrigir. Mitigado pelo
  `continue-on-error: true`. Após fase-5 fechar, este ADR é revisado para remover a
  tolerância.
- Não rodamos `npm run build` na CI — uma regressão de build (ex.: erro de prerender)
  só é detectada localmente ou em deploy. Mitigado pelo smoke check final da própria
  fase-7 e por execução manual antes de releases.

### Neutras

- Testes rodam sem banco (`testing-conventions.md > §8`); CI não precisa subir
  `docker-compose up -d db` nem qualquer Postgres.
- `npm ci` (em vez de `npm install`) é decisão deliberada — preserva o lockfile e
  falha se desincronizado.

## Referências

- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-7-dx-infra/requirements.md > Requirement 1.5`
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/handoff.md > Smoke checks finais`
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-2-testes/testing-conventions.md > §8`
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-4-design-system/tokens.md > Contrato com a CI da Fase 7`
- `c:/Users/edulanzarin/Documents/Dev/privello/.github/workflows/ci.yml` — pipeline.
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-7-dx-infra/dx-conventions.md > §1 CI Pipeline`

# ADR 0002 — Adoção de Vitest + fast-check como infraestrutura de testes

- **Status**: Aceito
- **Data**: 2026-03-14 (data original da decisão na fase-2-testes; este ADR documenta retroativamente)

## Contexto

Antes da fase-2-testes (`auditoria-geral > Fase 2`), o projeto não tinha **nenhum**
teste unitário automatizado. Os únicos testes existentes eram alguns Playwright E2E
em `tests/e2e/` cobrindo fluxos críticos do mobile (iOS Safari, sessão pré-master).

A fase-2 precisava entregar um runner de testes capaz de:

- Suportar **ESM-first** (o projeto é Next.js 16 + TS estrito + ESM nativo).
- Configuração mínima — não inflar `package.json > scripts` nem inventar build pipelines.
- Suportar **property-based testing** (PBT) para validar invariantes em código de
  segurança (rate limiting, cron auth, dev auth) e em queries do Prisma.
- Rodar em CI sem banco e sem rede em ≤ 60 s (contrato com a fase-7).
- Co-localizar testes ao lado do código (`*.test.ts`, `*.pbt.ts`).

Alternativas consideradas:

- **Jest + jest-property-based**: Jest 29+ tem suporte ESM mas exige configuração
  significativa (`transformIgnorePatterns`, `moduleNameMapper`); o ecossistema PBT
  para Jest é menos ativo.
- **Mocha + chai + fast-check direto**: setup mais manual; não há reporter equivalente
  ao do Vitest; perde watch mode integrado.
- **Node:test (nativo)**: imaturo em 2026-03; sem suporte nativo a TS sem loader extra;
  ecossistema PBT inexistente.

## Decisão

Adotamos **Vitest 4.1.6** + **fast-check 4.8.0** + **`@fast-check/vitest` 0.4.1** como
infraestrutura única de testes unitários e property-based. Versões pinadas (sem `^`)
para garantir reprodutibilidade entre máquinas e CI. Convenções:

- Co-localização: `*.test.ts` para exemplos; `*.pbt.ts` para property tests.
- `npm run test` = `vitest --run` (uma única passada, exit code preservado).
- `npm run test:watch` = `vitest` (watch mode local).
- Cobertura via `@vitest/coverage-v8` 4.1.6, opt-in (`vitest run --coverage`); não é gate.
- Playwright continua isolado em `tests/e2e/`, rodado manualmente. Não entra na CI desta fase.

## Consequências

### Positivas

- Paralelismo nativo (Vitest roda múltiplos arquivos em workers).
- API compatível com Jest (`describe`, `it`, `expect`) — curva zero para devs familiares.
- Suporte ESM nativo, sem `babel`/`ts-jest`.
- Watch mode rápido (re-roda só o que mudou).
- `@fast-check/vitest` integra `it.prop` e shrinking determinístico.
- 172 testes verdes em ≤ 5 s (medição da fase-2/3/4).

### Negativas

- Versões pinadas exigem PR dedicado para upgrade — não há `^` permitindo bump
  automático. Tradeoff aceito em troca de reprodutibilidade.
- Vitest é ainda menos pesquisado que Jest em StackOverflow histórico — devs novos
  podem precisar consultar `node_modules/vitest/dist/docs/` ou o site oficial.

### Neutras

- Playwright continua o único runner de E2E. Esta fase não consolida E2E + unit em
  um único runner.
- `coverage-v8` produz relatório mas a fase-2 declarou que **não é gate** (cf.
  `testing-conventions.md > §6`). Transformar em gate é Non-Goal da fase-7.

## Referências

- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-2-testes/design.md > Decisões de design importantes`
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-2-testes/testing-conventions.md`
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-2-testes/testing-conventions.md > §8 Contrato com a CI da Fase 7`
- `c:/Users/edulanzarin/Documents/Dev/privello/package.json` — versões pinadas.

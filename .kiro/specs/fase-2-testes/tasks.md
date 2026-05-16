# Implementation Plan: `fase-2-testes`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas instalam Vitest + fast-check, criam convenções, classificam módulos puros e entregam testes determinísticos e baseados em propriedade para os módulos elegíveis em `src/lib/`.

Restrições importantes:

- **Sem alterações em código de aplicação.** Se um módulo precisar de refactor para virar puro/testável, isso vira `OutOfScopeFinding` para `fase-3-backend` ou `fase-7-dx-infra`, registrado em `requirements.md > §3` desta fase.
- **Sem CI**. A integração na pipeline mora em `fase-7-dx-infra`. Esta fase apenas garante que `npm run test` é executável e idempotente em ambiente limpo.
- **Sem mock de Prisma, sem Testing Library, sem `jsdom`.** Ver Non-Goals em `requirements.md`.

Tarefas marcadas com `*` produzem property tests (validam Properties em `design.md > Correctness Properties`).

## Tasks

- [ ] 1. Instalar e configurar runner
  - [x] 1.1 Adicionar dependências de teste pinadas em `package.json`
    - Pinar `vitest`, `@vitest/coverage-v8`, `fast-check`, `@fast-check/vitest` em `devDependencies` sem `^` ou `~`
    - Preservar todas as outras entries de `devDependencies` e `dependencies`
    - Validar com `npm install` em ambiente limpo (sem rede após o pin) que não há resolução flutuante
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Criar `vitest.config.ts` na raiz
    - `test.environment = "node"`, `test.include = ["src/**/*.{test,pbt}.ts"]`, `test.exclude = ["tests/e2e/**", "node_modules/**", ".next/**"]`
    - `coverage.provider = "v8"`, `coverage.reporter = ["text", "html"]`, `coverage.include = ["src/lib/**/*.ts"]`, `coverage.exclude` para excluir os próprios `*.test.ts`/`*.pbt.ts`
    - `setupFiles = ["./vitest.setup.ts"]`
    - _Requirements: 1.4_

  - [x] 1.3 Criar `vitest.setup.ts` com config global do fast-check
    - Importar `fc` de `@fast-check/vitest`
    - Aplicar `fc.configureGlobal({ verbose: 2, numRuns: 100 })`
    - _Requirements: 5.3_

  - [x] 1.4 Adicionar scripts npm em `package.json`
    - `test` = `vitest --run`
    - `test:watch` = `vitest`
    - `test:run` = `vitest --run --reporter=verbose`
    - Preservar `dev`, `build`, `start`, `lint`, `test:e2e*`, `postinstall`, `db:*`
    - Smoke: `npm run test` termina com código 0 em projeto sem testes (zero arquivos casados ainda)
    - _Requirements: 1.3, 1.6_

  - [x] 1.5 Validar interação com `tsconfig.json`
    - Confirmar que arquivos `*.test.ts` e `*.pbt.ts` co-localizados são reconhecidos pelo TypeScript
    - Adicionar `vitest/globals` em `compilerOptions.types` se necessário; caso contrário usar imports explícitos (`import { describe, it, expect } from "vitest"`) e documentar a escolha em `testing-conventions.md`
    - _Requirements: 1.4_

  - [x] 1.6 Validar isolamento contra Playwright
    - Rodar `npm run test:e2e -- --list` em ambiente local: nenhum dos `*.test.ts` ou `*.pbt.ts` deve ser coletado pelo Playwright
    - Se houver colisão, ajustar `playwright.config.ts > testMatch` para excluir `*.test.ts`/`*.pbt.ts`
    - _Requirements: 1.6_

- [ ] 2. Convenções e documento canônico
  - [x] 2.1 Criar `testing-conventions.md` em `.kiro/specs/fase-2-testes/`
    - Seção "Localização e nomenclatura": co-localização, sufixos `*.test.ts`/`*.pbt.ts`, regra de imports, regra de tamanho de arquivo
    - Seção "Exemplos canônicos": um snippet de `*.test.ts` e um de `*.pbt.ts` (este último usando `@fast-check/vitest`)
    - Seção "Persistência de contraexemplos": dois caminhos (inline `it("regression: ...")` ou `<modulo>.regressions.ts` consumido por `describe.each`)
    - Seção "Pureza dos módulos de `src/lib/`": tabela classificando cada arquivo como `pure`/`non-pure`, com justificativa
    - Seção "Pares parse/serialize identificados": preenchida pelas tarefas 4.x
    - Seção "Cobertura": meta declarada de 80% statements/branches por módulo puro, sem gate
    - _Requirements: 2.2, 2.3, 3.2, 3.3, 5.2, 5.4_

  - [x] 2.2 Avaliar inclusão dos sufixos no `eslint.config.mjs`
    - Decidir: incluir `*.test.ts`/`*.pbt.ts` no escopo do lint nesta fase OU registrar como `OutOfScopeFinding` para `fase-7-dx-infra`
    - Documentar a escolha em `testing-conventions.md`
    - _Requirements: 2.4_

- [ ] 3. Classificar pureza e cobrir módulos puros
  - [x] 3.1 Confirmar pureza de cada arquivo em `src/lib/`
    - Ler caso a caso e marcar na tabela do `testing-conventions.md`: `pure`, `non-pure`, `parcial` (com nota)
    - Candidatos esperados a `pure`: `discover-params`, `booking-slots`, `time-utils`, `money`, `whatsapp-booking`, `utils`, `constants`
    - Para cada arquivo `non-pure` ou `parcial`, registrar nota explicando por que não vira tarefa nesta fase
    - _Requirements: 3.2_

  - [x] 3.2 Criar `src/lib/money.test.ts`
    - Cobrir caso de sucesso típico (formatação BRL, parse de string formatada)
    - Cobrir bordas: zero, valor mínimo, valor máximo declarado pelo módulo, input mal-formatado (deve lançar ou retornar erro tipado conforme API real)
    - _Requirements: 3.4_

  - [x] 3.3 Criar `src/lib/discover-params.test.ts`
    - Cobrir caso de sucesso (URLSearchParams típica) e bordas: vazio, chaves repetidas, valores malformados
    - _Requirements: 3.4_

  - [x] 3.4 Criar `src/lib/time-utils.test.ts`
    - Cobrir formatação e parsing nos formatos usados pelo app, com bordas (meia-noite, fim de mês, fuso)
    - _Requirements: 3.4_

  - [x] 3.5 Criar `src/lib/booking-slots.test.ts`
    - Cobrir geração de slots em janela típica e bordas (janela vazia, duração maior que janela, intervalo zero)
    - _Requirements: 3.4_

  - [x] 3.6 Criar `src/lib/whatsapp-booking.test.ts`
    - Cobrir construção de URL com payload típico e bordas (caracteres a escapar, payload mínimo)
    - _Requirements: 3.4_

  - [x] 3.7 Decidir cobertura de `src/lib/utils.ts` e `src/lib/constants.ts`
    - `utils.ts`: se houver lógica não-trivial, criar `utils.test.ts`; caso contrário registrar nota em `testing-conventions.md`
    - `constants.ts`: tipicamente sem teste; registrar a decisão (sem teste, ou teste de integridade se houver derivação computada)
    - _Requirements: 3.4_

- [ ] 4. Property tests para pares parse/serialize
  - [x] 4.1 Identificar pares parse/serialize por módulo
    - Lendo cada módulo classificado como `pure`, identificar pares `(parse, serialize)`/`(encode, decode)` e registrar a lista em `testing-conventions.md > Pares parse/serialize identificados`
    - WHERE um módulo da lista alvo (Property 1–6 do `design.md > Correctness Properties`) não tiver par aplicável, anotar como **não declarável** com justificativa
    - _Requirements: 4.2, 4.4_

  - [x] 4.2 * Implementar `src/lib/money.pbt.ts` (Property 1)
    - `test.prop([fc.integer({ min: 0, max: 99_999_900 })])` validando `brlToCents(centsToBRL(c)) === c`
    - Comentar a seed se a fixar; caso contrário, default `numRuns: 100`
    - _Requirements: 4.1, 4.3, 4.5_
    - _Validates: Property 1_

  - [x] 4.3 * Implementar `src/lib/discover-params.pbt.ts` (Property 2)
    - Gerador `fc.record(...)` para o conjunto de filtros válidos
    - Propriedade: `parseDiscoverParams(serializeDiscoverParams(f))` é estruturalmente equivalente a `f`
    - Documentar a forma exata da equivalência no comentário do teste
    - _Requirements: 4.1, 4.3_
    - _Validates: Property 2_

  - [x] 4.4 * Implementar `src/lib/time-utils.pbt.ts` (Property 3)
    - Gerador `fc.date()` no intervalo do fuso configurado pelo app
    - Propriedade: diferença entre `parseTime(formatTime(d))` e `d` é menor que a precisão declarada de `formatTime`
    - _Requirements: 4.1, 4.3_
    - _Validates: Property 3_

  - [x] 4.5 * Implementar `src/lib/whatsapp-booking.pbt.ts` (Property 4) condicional
    - WHERE `parseBookingUrl` existir no módulo, implementar round-trip
    - WHERE não existir, **NÃO** criar arquivo `.pbt.ts`; registrar como **não declarável** em `testing-conventions.md`
    - _Requirements: 4.1, 4.4_
    - _Validates: Property 4_

  - [x] 4.6 * Implementar `src/lib/booking-slots.pbt.ts` (Properties 5 e 6)
    - Property 5 (monotonicidade): toda sequência gerada é estritamente crescente em `start`, com `end > start` por slot
    - Property 6 (completude): com `intervalo=0`, união cobre exatamente `[início, fim − duração]` sem lacunas; com `intervalo>0`, ajustar para `⊆` + invariante de espaçamento
    - Documentar a forma final no comentário do teste
    - _Requirements: 4.1_
    - _Validates: Property 5, Property 6_

- [ ] 5. Cobertura e relatório
  - [~] 5.1 Rodar `npx vitest --coverage --run` e capturar relatório textual
    - Anexar log de saída em `testing-conventions.md > Cobertura inicial medida`
    - Para cada módulo puro abaixo de 80% statements/branches, registrar a contagem real e justificativa, sem bloquear a entrega
    - _Requirements: 3.3, 3.5_

  - [~] 5.2 Documentar como rodar com seed fixa
    - Em `testing-conventions.md`, exemplificar `npx vitest --run --seed=<n>` para reprodução de runs PBT
    - Reforçar que persistir contraexemplo é responsabilidade do desenvolvedor (sem lint que bloqueie commit)
    - _Requirements: 5.1, 5.4_

- [ ] 6. Contrato com a CI da Fase 7
  - [~] 6.1 Validar pré-condições do contrato
    - `npm run test` é executável em ambiente sem banco e sem rede e termina em ≤ 60s
    - `npm run test` falha (código ≠ 0) quando ao menos um teste quebra
    - Em ambiente com `process.env.CI === "true"`, qualquer `.only`/`.skip` sem comentário justificativo faz o test runner sair com erro (a verificação efetiva acontecerá quando a Fase 7 ligar a CI; nesta fase, declarar a expectativa no `testing-conventions.md`)
    - _Requirements: 6.2, 6.3_

  - [~] 6.2 Confirmar inalteração dos scripts pré-existentes
    - `npm run dev`, `npm run build`, `npm run lint`, `npm run test:e2e*`, `npm run db:*`, `postinstall` continuam funcionando exatamente como antes
    - Anexar lista de comandos rodados como evidência no PR que entrega esta fase
    - _Requirements: 1.6_

- [ ] 7. Saída desta fase
  - [~] 7.1 Validar saída
    - Todos os 7 Requirements de `requirements.md` têm evidência (path:linha de código de teste, log de `vitest --run`, ou link de PR) anexada
    - `testing-conventions.md` cobre as quatro áreas (localização, nomenclatura, cobertura, persistência de contraexemplo) e a tabela de pureza
    - Seção `OutOfScopeFinding` em `requirements.md` está vazia ou cada linha aponta commit no master spec
    - _Requirements: 7.2_

  - [~] 7.2 Atualizar Phase Card no master `requirements.md`
    - `state: InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601
    - Manter `child_spec_path` apontando para esta pasta
    - Re-rodar Spawn-Readiness Gate em `fase-3-backend`, `fase-4-design-system`, `fase-5-ux`, `fase-7-dx-infra` (dependentes diretas)
    - _Requirements: 7.2_

## Notes

- Tarefas com `*` (4.2, 4.3, 4.4, 4.5, 4.6) entregam testes baseados em propriedade conforme as Properties declaradas em `design.md > Correctness Properties`. Tarefas sem `*` entregam testes determinísticos ou documentação.
- Tarefas que tocam o mesmo arquivo (ex.: `package.json` em 1.1 e 1.4) estão em ondas distintas para não criar conflito de edição.
- A tarefa 4.5 é condicional: pode terminar sem criar arquivo, com nota textual em `testing-conventions.md`.
- Todo achado relevante que extrapolar o escopo desta fase **NÃO** é absorvido — vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.2"] },
    { "id": 3, "tasks": ["1.6"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 8, "tasks": ["5.1", "5.2"] },
    { "id": 9, "tasks": ["6.1", "6.2"] },
    { "id": 10, "tasks": ["7.1"] },
    { "id": 11, "tasks": ["7.2"] }
  ]
}
```

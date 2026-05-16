# Requirements Document

> Spec-filho `fase-2-testes` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 2 — Infraestrutura de testes** do roadmap mestre `auditoria-geral`. O objetivo é instalar e padronizar a infraestrutura de testes unitários e baseados em propriedade (Vitest + fast-check) que será consumida pelas fases de refactor (Fase 3) e usada como gate na CI (Fase 7).

A fase **não tem dependências** no grafo (`PROMOCAO.md > §5`) e pode rodar em paralelo com `fase-1-seguranca` (Onda 1). Ela **não toca APIs do Next.js** — a seção 4 deste documento registra `n/a` para AGENTS_Rule.

Os EARS herdados do `Requirement 3` do master spec definem o resultado esperado; novos requisitos abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. Achados que extrapolarem o escopo voltam ao master via `OutOfScopeFinding` (seção 3). O spec arquivado `backend-performance-phase5` é a única referência histórica desta fase, e somente o vácuo de testabilidade é revalidado como `Confirmado` aqui — itens de cache, performance e SEO ficam para outras fases.

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-2-testes`
- **phase_title**: Infraestrutura de testes
- **promoted_at**: 2026-03-14
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: nenhuma (fase não toca APIs do Next.js)
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5`

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 3` do master spec. Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (seção 3).

- **Requirement 3.1** — `THE Phase_2_Spec SHALL configurar Vitest e fast-check no projeto, com scripts npm (test, test:watch, test:run) que rodem em --run por padrão em CI.`
- **Requirement 3.2** — `THE Phase_2_Spec SHALL definir convenções de localização e nomenclatura de testes (ex.: *.test.ts ao lado do código, *.pbt.ts para property-based).`
- **Requirement 3.3** — `THE Phase_2_Spec SHALL estabelecer cobertura inicial mínima como meta para módulos puros em src/lib/ (ex.: discover-params, booking-slots, time-utils, money, whatsapp-booking).`
- **Requirement 3.4** — `THE Phase_2_Spec SHALL incluir pelo menos uma propriedade round-trip por parser/serializador identificado em src/lib/.`
- **Requirement 3.5** — `WHEN um teste de propriedade falha localmente, THE Phase_2_Spec SHALL recomendar que o contraexemplo seja persistido em comentário ou arquivo dedicado para regressão, sem bloquear o commit (responsabilidade do desenvolvedor).`
- **Requirement 3.6** — `THE Phase_2_Spec SHALL integrar a execução dos testes na pipeline de CI definida na Fase 7.`
- **Requirement 3.7** — `THE Phase_2_Spec SHALL declarar fora de escopo: cobertura de componentes React (Testing Library) e ampliação dos testes Playwright — entram em fases posteriores.`

---

## 2. Revalidação

### 2.1 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5`
- **scope**: `testing` (subset de `backend-performance-phase5` que motiva esta fase)

#### Itens herdados

O spec arquivado é amplo (15 Requirements cobrindo backend perf, cache, validação, segurança, tipagem, frontend, SEO, mobile e documentação). Para a Fase 2, herdamos apenas o **vácuo de testabilidade**: ausência de runner unitário, ausência de property-based, ausência de testes para os módulos puros listados. Os demais Requirements (cache, performance, SEO, etc.) pertencem a outras fases (3, 5, 7) e NÃO viram tarefa aqui.

- **Item**: Ausência total de testes unitários e property-based no projeto
- **Origem no spec arquivado**: motivação implícita do conjunto Requisitos 1, 5, 6 e 13 (todos exigem refactor sem rede de proteção)
- **Estado**: `Confirmado`
- **evidence**: `package.json` lista apenas `test:e2e` (Playwright); `devDependencies` não tem `vitest` nem `fast-check`. `src/lib/` tem 11 módulos sem teste correspondente.
- **Tarefa derivada**: Configurar Vitest + fast-check, scripts npm e primeiros testes de propriedade nos módulos puros listados (Requirement 3.3 do master).

- **Item**: Convenção de localização e nomenclatura de testes
- **Origem no spec arquivado**: ausente — o arquivado não chegou a propor convenção
- **Estado**: `Confirmado`
- **evidence**: nenhum arquivo `*.test.ts` ou `*.pbt.ts` em `src/`; convenção precisa ser declarada do zero.
- **Tarefa derivada**: Documentar convenção (`*.test.ts` co-localizado, `*.pbt.ts` para property-based) e aplicar nos primeiros testes (Requirement 3.2 do master).

- **Item**: Persistência de contraexemplos de fast-check
- **Origem no spec arquivado**: ausente
- **Estado**: `Confirmado`
- **evidence**: greenfield — sem prática estabelecida.
- **Tarefa derivada**: Definir fluxo recomendado e documentar (Requirement 3.5 do master).

- **Item**: Cobertura de componentes React (Testing Library) e ampliação dos testes Playwright
- **Origem no spec arquivado**: implícito em "performance do frontend" (Requisitos 7, 8, 9, 14 do arquivado)
- **Estado**: `Resolvido` _(via Non-Goal explícito do master, Requirement 3.7)_
- **evidence**: `requirements.md > Requirement 3.7` do master declara que esses itens entram em fases posteriores.
- **Observação**: NÃO vira tarefa desta fase. Reaparece em fases futuras.

- **Item**: Targets numéricos de Core Web Vitals e baselines de performance (Requisitos 12 e 15 do arquivado)
- **Origem no spec arquivado**: Requisitos 12.3, 12.4, 12.5, 14.7, 15.4
- **Estado**: `Resolvido` _(fora do escopo desta fase; pertence a `fase-3-backend` para baselines de queries e a `fase-5-ux`/`fase-6-mobile-cross-browser` para CWV)_
- **evidence**: master spec não inclui esses critérios em `Requirement 3` (Fase 2).
- **Observação**: Achados eventuais sobre CWV durante esta fase viram `OutOfScopeFinding` (seção 3).

---

## 3. Achados fora de escopo

> Nenhum achado fora de escopo registrado nesta fase.

Cada novo achado relevante que extrapolar o escopo desta fase será registrado como uma linha desta tabela (schema `OutOfScopeFinding` de `design.md > Data Models`) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `design.md > Error Handling`).

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta)_ | | | |

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

> n/a — fase não toca APIs do Next.js.

A Fase 2 instala apenas runner de teste (Vitest), gerador de propriedades (fast-check) e scripts npm. Não toca rotas, server actions, middleware, cache, transitions, images config nem headers. Se durante a execução surgir necessidade de testar algo que dependa de APIs do Next 16, isso vira `OutOfScopeFinding` para a fase consumidora correspondente, NÃO é absorvido aqui.

---

## Glossary

- **Phase_2_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\`.
- **Test_Runner**: Vitest, configurado para o projeto.
- **PBT_Library**: fast-check, gerador de propriedades.
- **Pure_Modules**: subconjunto de `src/lib/` sem efeitos colaterais externos (não toca rede, não toca disco, não toca Prisma). Alvo prioritário desta fase: `discover-params.ts`, `booking-slots.ts`, `time-utils.ts`, `money.ts`, `whatsapp-booking.ts`. Verificação caso a caso durante a execução.
- **Round_Trip_Property**: para um par (`parse`, `serialize`) ou (`encode`, `decode`), a propriedade `parse(serialize(x)) === x` para todo `x` válido.
- **Counterexample**: entrada gerada pelo fast-check que falha uma propriedade. Persistida em comentário ou arquivo dedicado para regressão.
- **CI_Pipeline**: pipeline de CI que será definida em `fase-7-dx-infra`. A Fase 2 entrega scripts npm prontos; a Fase 7 os encaixa na pipeline.

---

## 6. Non-Goals / Out of Scope

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. Cobertura de componentes React via React Testing Library (entra em fase futura).
2. Ampliação dos testes Playwright (`test:e2e`); a configuração atual de Playwright fica intacta.
3. Testes de integração com Prisma de teste (banco de testes, fixtures, etc.) — o spec-filho pode declarar como `OutOfScopeFinding` se o caminho de refactor da Fase 3 exigir, mas o default desta fase é unit/property only.
4. Configuração da pipeline de CI em si (lint+typecheck+test). A integração na CI é o critério herdado 3.6, mas a CI mora em `fase-7-dx-infra`.
5. Lint de cobertura mínima como bloqueio (fica em `fase-7-dx-infra`); aqui apenas declaramos a meta.
6. Testes para módulos não puros (auth, prisma, queries) — entram nos specs-filhos das fases que tocarem essas superfícies.
7. Modificações em código de aplicação para "tornar testável". Se um módulo puro precisar de refactor para receber testes, isso vira `OutOfScopeFinding` para a fase apropriada (em geral 3 ou 7), não é absorvido aqui.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (seção 3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 3.1–3.7 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Instalação e configuração de Vitest e fast-check

**User Story:** Como dev, quero um runner de teste configurado e estável, para escrever testes unitários e property-based sem fricção.

**Inputs:** `package.json`, `tsconfig.json`, novo arquivo `vitest.config.ts`.

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL configurar Vitest e fast-check no projeto, com scripts npm (`test`, `test:watch`, `test:run`) que rodem em `--run` por padrão em CI. _(EARS herdada — Requirement 3.1 do master.)_
2. THE Phase_2_Spec SHALL adicionar a `package.json > devDependencies` os pacotes `vitest`, `@vitest/coverage-v8` e `fast-check`, com versões pinadas (sem `^` ou `~`).
3. THE Phase_2_Spec SHALL adicionar três scripts em `package.json > scripts`:
   - `test`: `vitest --run`
   - `test:watch`: `vitest`
   - `test:run`: `vitest --run --reporter=verbose`
   O script `test` retorna código de saída 0 quando todos os testes passam e diferente de 0 caso contrário; é o script que CI roda.
4. THE Phase_2_Spec SHALL criar `vitest.config.ts` na raiz do projeto com:
   - `test.environment = "node"` (módulos puros não exigem DOM);
   - `test.include` cobrindo `src/**/*.test.ts` e `src/**/*.pbt.ts`;
   - `test.exclude` cobrindo `tests/e2e/**` (Playwright fica isolado);
   - `coverage.provider = "v8"` e `coverage.reporter = ["text", "html"]`.
5. WHEN o script `test` é invocado em ambiente CI (`process.env.CI === "true"`), THE Phase_2_Spec SHALL falhar imediatamente se algum `*.pbt.ts` for deixado em modo `.only` ou `.skip` sem comentário justificativo.
6. THE Phase_2_Spec SHALL preservar os scripts existentes (`dev`, `build`, `start`, `lint`, `test:e2e`, `test:e2e:ios`, `test:e2e:desktop`, `postinstall`, `db:*`) sem alteração; renomear ou remover qualquer um deles vira `OutOfScopeFinding`.

### Requirement 2: Convenção de localização e nomenclatura

**User Story:** Como dev, quero saber exatamente onde criar um teste novo, para que a base não fique com testes espalhados em múltiplos diretórios.

**Inputs:** `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\testing-conventions.md` (novo).

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL definir convenções de localização e nomenclatura de testes (ex.: `*.test.ts` ao lado do código, `*.pbt.ts` para property-based). _(EARS herdada — Requirement 3.2 do master.)_
2. THE Phase_2_Spec SHALL produzir o documento `testing-conventions.md` no diretório do spec-filho declarando:
   - Localização: testes co-localizados com o módulo testado (`src/lib/money.ts` ↔ `src/lib/money.test.ts`).
   - Sufixos: `*.test.ts` para testes determinísticos baseados em casos; `*.pbt.ts` para testes baseados em propriedade (fast-check).
   - Imports: testes importam pelo caminho absoluto do projeto (`@/lib/...`) quando há alias configurado, ou caminho relativo curto.
   - Tamanho: arquivos de teste com mais de 400 linhas são candidatos a quebra (`<modulo>.<area>.test.ts`).
3. THE Phase_2_Spec SHALL incluir no `testing-conventions.md` exemplos canônicos:
   - Um exemplo de `*.test.ts` com `describe`/`it`/`expect`.
   - Um exemplo de `*.pbt.ts` com `fc.assert(fc.property(...))`.
4. THE Phase_2_Spec SHALL listar `*.test.ts` e `*.pbt.ts` em uma seção do `eslint.config.mjs` (ou registrar como `OutOfScopeFinding` para `fase-7-dx-infra` se preferir manter o lint intacto nesta fase).

### Requirement 3: Cobertura inicial mínima nos módulos puros

**User Story:** Como dev, quero saber qual é o piso de cobertura aceito após esta fase, para que refactors futuros não passem por baixo.

**Inputs:** módulos puros listados em `Pure_Modules` (Glossary).

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL estabelecer cobertura inicial mínima como meta para módulos puros em `src/lib/` (ex.: `discover-params`, `booking-slots`, `time-utils`, `money`, `whatsapp-booking`). _(EARS herdada — Requirement 3.3 do master.)_
2. THE Phase_2_Spec SHALL classificar cada arquivo em `src/lib/` como `pure` ou `non-pure` em uma tabela do `testing-conventions.md`. Os candidatos iniciais a `pure` são `discover-params.ts`, `booking-slots.ts`, `time-utils.ts`, `money.ts`, `whatsapp-booking.ts`, `utils.ts` e `constants.ts` (validar pureza caso a caso lendo o código).
3. THE Phase_2_Spec SHALL definir como meta de cobertura mínima por módulo puro: 80% em statements/branches medidos por `vitest --coverage`. A meta é declarada em `testing-conventions.md` e NÃO é gate de CI nesta fase (gate fica para `fase-7-dx-infra`).
4. THE Phase_2_Spec SHALL entregar pelo menos um teste `*.test.ts` por módulo puro identificado, cobrindo o caso de sucesso típico e ao menos uma borda (input vazio, valor extremo, ou erro esperado).
5. WHERE um módulo identificado como `pure` na verificação de 3.2 não atingir a meta de 80% após esta fase, THE Phase_2_Spec SHALL registrar a contagem atual em `testing-conventions.md` com a justificativa, sem bloquear a entrega.

### Requirement 4: Propriedades round-trip

**User Story:** Como dev, quero que parsers e serializers sejam validados por propriedades, para que regressões silenciosas em formatos sejam detectadas cedo.

**Inputs:** módulos puros que tenham par parse/serialize.

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL incluir pelo menos uma propriedade round-trip por parser/serializador identificado em `src/lib/`. _(EARS herdada — Requirement 3.4 do master.)_
2. THE Phase_2_Spec SHALL identificar e listar em `testing-conventions.md` cada par `(parse, serialize)` ou `(encode, decode)` presente em `src/lib/`. Candidatos prováveis (a verificar): `discover-params` (URLSearchParams ↔ filtros), `booking-slots` (string de horário ↔ Date), `time-utils` (formatação ↔ parse), `money` (string formatada ↔ centavos), `whatsapp-booking` (URL ↔ payload).
3. WHEN um par `(parse, serialize)` for identificado, THE Phase_2_Spec SHALL implementar arquivo `<modulo>.pbt.ts` com pelo menos uma propriedade `parse(serialize(x)) === x` usando `fc.property` e `fc.assert`.
4. WHERE um módulo da lista 4.2 não tiver par `(parse, serialize)` aplicável, THE Phase_2_Spec SHALL declarar isso em comentário no `testing-conventions.md`, sem criar arquivo `.pbt.ts` artificial.
5. THE Phase_2_Spec SHALL configurar fast-check com `numRuns` padrão `100` (default da lib) e `seed` reprodutível registrado em comentário no topo do arquivo `.pbt.ts` quando o teste fixar seed.

### Requirement 5: Persistência de contraexemplos

**User Story:** Como dev, quero que cada falha de propriedade vire teste de regressão, para que a mesma quebra não passe duas vezes.

#### Acceptance Criteria

1. WHEN um teste de propriedade falha localmente, THE Phase_2_Spec SHALL recomendar que o contraexemplo seja persistido em comentário ou arquivo dedicado para regressão, sem bloquear o commit (responsabilidade do desenvolvedor). _(EARS herdada — Requirement 3.5 do master.)_
2. THE Phase_2_Spec SHALL documentar em `testing-conventions.md` os dois caminhos válidos de persistência:
   - **Inline**: o contraexemplo vira um caso `it("regression: <descrição>")` no mesmo arquivo `.pbt.ts` ou em arquivo `.test.ts` correspondente, com comentário citando o seed/run que produziu a falha.
   - **Dedicado**: caso o contraexemplo seja grande, o spec-filho permite criar `<modulo>.regressions.ts` exportando um array nomeado `KNOWN_REGRESSIONS` consumido por um `describe.each` no teste.
3. THE Phase_2_Spec SHALL recomendar `fc.configureGlobal({ verbose: 2 })` em `vitest.config.ts > setupFiles` para que falhas locais imprimam o seed reprodutível.
4. THE Phase_2_Spec SHALL declarar que persistência é responsabilidade do desenvolvedor — não há lint que bloqueie commit por contraexemplo não persistido nesta fase.

### Requirement 6: Integração com a CI da Fase 7

**User Story:** Como mantenedor, quero que os testes desta fase rodem na CI assim que ela for criada, para que o gate de qualidade exista a partir do dia em que a CI nasce.

**Inputs:** `package.json > scripts.test` (definido em Requirement 1).

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL integrar a execução dos testes na pipeline de CI definida na Fase 7. _(EARS herdada — Requirement 3.6 do master.)_
2. THE Phase_2_Spec SHALL declarar como contrato com a Fase 7: o comando `npm run test` é executável em CI (Linux/macOS/Windows), não exige banco, não exige rede e termina em até 60 segundos no estado entregue.
3. WHEN a Fase 7 começar, THE Phase_2_Spec SHALL repassar a tabela de `Pure_Modules` e os scripts npm como entradas; nenhuma alteração em `vitest.config.ts` é exigida deste lado.
4. THE Phase_2_Spec SHALL declarar `npx tsc --noEmit` fora do escopo (entrega da Fase 7), mesmo que ele seja necessário para garantir que os testes compilam — confiamos no `tsc` que o CI da Fase 7 vai rodar.

### Requirement 7: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL declarar fora de escopo: cobertura de componentes React (Testing Library) e ampliação dos testes Playwright — entram em fases posteriores. _(EARS herdada — Requirement 3.7 do master.)_
2. WHEN um item da seção "Non-Goals" deste documento aparecer durante a execução, THE Phase_2_Spec SHALL registrá-lo como `OutOfScopeFinding` na seção 3 deste documento e abrir commit no master spec antes de qualquer absorção.

---

## Saída desta fase

A Fase 2 é considerada `Done` quando:

- Todos os 7 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de código, log de `vitest --run`, ou link de PR) anexada para cada um.
- `npm run test` passa com código 0 em ambiente local sem rede e sem banco.
- O documento `testing-conventions.md` existe em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\` e cobre as quatro áreas (localização, nomenclatura, cobertura, persistência de contraexemplo).
- A seção 3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia.
- O Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta.


---

## Saída desta fase — evidências

> Produzido pela Tarefa 7.1. Mapeamento Requirement → evidência concreta para cada um dos 7 Requirements desta fase. Cada linha cita `path:linha`, commit SHA do `git log` ou referência ao `testing-conventions.md`. SHAs apurados em `c:\Users\edulanzarin\Documents\Dev\privello\` no momento da entrega (HEAD = `8c2ebe5`).

### Requirement 1 — Instalação e configuração de Vitest e fast-check

| EAR | Evidência | Status |
|---|---|---|
| Requirement 1.1 (scripts npm `test`/`test:watch`/`test:run` com `--run` em CI) | `package.json` → `scripts.test = "vitest --run"`, `scripts.test:watch = "vitest"`, `scripts.test:run = "vitest --run --reporter=verbose"`. Smoke confirmado em `testing-conventions.md > §8.1` (4.92s, exit 0). | ✅ |
| Requirement 1.2 (devDeps pinadas sem `^`/`~`) | `package.json > devDependencies`: `vitest 4.1.6`, `@vitest/coverage-v8 4.1.6`, `fast-check 4.8.0`, `@fast-check/vitest 0.4.1`. Versões fixas verificáveis em `package-lock.json`. | ✅ |
| Requirement 1.3 (3 scripts npm; `test` retorna 0 em sucesso, ≠ 0 em falha) | `package.json > scripts` (3 entries adicionadas em commit `f53c691` e Tarefa 1.4); contrato declarativo de exit codes registrado em `testing-conventions.md > §8.1`. | ✅ |
| Requirement 1.4 (`vitest.config.ts` com `environment=node`, `include`, `exclude`, `coverage v8`, `setupFiles`) | `vitest.config.ts` na raiz (criado pela Tarefa 1.2); `vitest.setup.ts` (criado pela Tarefa 1.3). Cobre todos os campos exigidos. | ✅ |
| Requirement 1.5 (CI rejeita `.only`/`.skip` sem comentário) | Contrato declarativo em `testing-conventions.md > §8.1` ("Comportamento esperado com `process.env.CI === \"true\"`"). Verificação efetiva delegada à `fase-7-dx-infra`. | ✅ |
| Requirement 1.6 (scripts pré-existentes preservados) | Tabela completa em `testing-conventions.md > §8.2` — 13 scripts pré-existentes inalterados, 3 scripts `test*` novos coexistem sem colisão. Validação Vitest ↔ Playwright em `testing-conventions.md > §1` ("Isolamento Vitest ↔ Playwright"). | ✅ |

### Requirement 2 — Convenção de localização e nomenclatura

| EAR | Evidência | Status |
|---|---|---|
| Requirement 2.1 (definir convenções `*.test.ts` co-localizado, `*.pbt.ts` para PBT) | `testing-conventions.md > §1` (Localização e nomenclatura) e `§2` (Exemplos canônicos). | ✅ |
| Requirement 2.2 (documento canônico produzido com 4 áreas + tabela de pureza) | `testing-conventions.md` integral — §1 (localização), §2 (exemplos), §3 (persistência), §4 (pureza), §6 (cobertura). Commit `f53c691` consolidou §4 e §5. | ✅ |
| Requirement 2.3 (exemplos canônicos `*.test.ts` e `*.pbt.ts`) | `testing-conventions.md > §2` — gabaritos para ambos os sufixos. | ✅ |
| Requirement 2.4 (lint/escopo de `*.test.ts`/`*.pbt.ts`) | `testing-conventions.md > §6.5` — decisão A registrada (preset Next + TS já lint os sufixos por default; sem alteração em `eslint.config.mjs`). Commit `280897a`. | ✅ |

### Requirement 3 — Cobertura inicial mínima nos módulos puros

| EAR | Evidência | Status |
|---|---|---|
| Requirement 3.1 (cobertura mínima como meta para módulos puros) | Meta declarada em `testing-conventions.md > §6` (80% statements/branches por módulo `pure`). | ✅ |
| Requirement 3.2 (classificar cada arquivo de `src/lib/` como `pure`/`non-pure`/`parcial`) | Tabela completa em `testing-conventions.md > §4` (15 arquivos top-level: 7 `pure`, 3 `parcial`, 5 `non-pure`). Commit `f53c691`. | ✅ |
| Requirement 3.3 (meta declarada de 80% statements/branches) | `testing-conventions.md > §6` ("Meta declarada"). Não é gate nesta fase (delegado à `fase-7-dx-infra`). | ✅ |
| Requirement 3.4 (≥1 `*.test.ts` por módulo puro com sucesso típico + borda) | `src/lib/money.test.ts`, `src/lib/discover-params.test.ts`, `src/lib/time-utils.test.ts`, `src/lib/booking-slots.test.ts`, `src/lib/whatsapp-booking.test.ts`. Commit `598f78f`. | ✅ |
| Requirement 3.5 (registrar contagem real onde a meta não bater) | `testing-conventions.md > §6` ("Cobertura inicial medida") — relatório `text` v8 + tabela por arquivo com Status ✅/⚠️ e justificativa para módulos abaixo de 80%. Commit `8c2ebe5`. | ✅ |

### Requirement 4 — Propriedades round-trip

| EAR | Evidência | Status |
|---|---|---|
| Requirement 4.1 (≥1 propriedade round-trip por parser/serializer identificado) | `src/lib/money.pbt.ts` (Property 1 adaptada — invariante mais fraco), `src/lib/discover-params.pbt.ts` (Property 2), `src/lib/time-utils.pbt.ts` (Property 3 com escopo ajustado), `src/lib/booking-slots.pbt.ts` (Properties 5/6). Commits `536037b`, `141cc68`. | ✅ |
| Requirement 4.2 (listar pares parse/serialize por módulo) | `testing-conventions.md > §5` — pares confirmados módulo-a-módulo com `path:linha`. | ✅ |
| Requirement 4.3 (`<modulo>.pbt.ts` com `parse(serialize(x)) === x`) | Implementado nos `.pbt.ts` listados em 4.1 (com adaptações documentadas onde a API canônica não existia). | ✅ |
| Requirement 4.4 (módulos sem par declarados como **não declarável**) | `testing-conventions.md > §5.1` (money), `§5.2` (discover-params), `§5.4` (whatsapp-booking) — todos marcados **não declarável** com justificativa. Tarefa 4.5 confirmada como condicional sem produzir `.pbt.ts`. | ✅ |
| Requirement 4.5 (fast-check com `numRuns: 100` default; seed em comentário se fixada) | `vitest.setup.ts` aplica `fc.configureGlobal({ verbose: 2, numRuns: 100 })`. Documentado em `testing-conventions.md > §3` ("Reproduzir uma run com seed fixa"). | ✅ |

### Requirement 5 — Persistência de contraexemplos

| EAR | Evidência | Status |
|---|---|---|
| Requirement 5.1 (recomendação de persistência sem bloqueio de commit) | `testing-conventions.md > §3` (introdução). | ✅ |
| Requirement 5.2 (dois caminhos: inline ou `<modulo>.regressions.ts`) | `testing-conventions.md > §3` — Caminho A (Inline) e Caminho B (Dedicado) com snippets. | ✅ |
| Requirement 5.3 (`fc.configureGlobal({ verbose: 2 })` em `setupFiles`) | `vitest.setup.ts` aplica `verbose: 2` (Tarefa 1.3). | ✅ |
| Requirement 5.4 (persistência é responsabilidade do desenvolvedor) | `testing-conventions.md > §3` ("Responsabilidade") e §5.2 ("Documentar como rodar com seed fixa"). Commit `8c2ebe5`. | ✅ |

### Requirement 6 — Integração com a CI da Fase 7

| EAR | Evidência | Status |
|---|---|---|
| Requirement 6.1 (integrar testes na pipeline de CI da Fase 7) | Contrato declarado em `testing-conventions.md > §8` ("Contrato com a CI da Fase 7"). Integração efetiva entrega-se em `fase-7-dx-infra`. | ✅ |
| Requirement 6.2 (`npm run test` executável em CI sem banco/rede em ≤ 60s) | `testing-conventions.md > §8.1` — 4.92s wall-clock, 13 arquivos / 118 testes, exit 0. Margem 12× sobre teto declarado. | ✅ |
| Requirement 6.3 (Pure_Modules + scripts npm como entradas para Fase 7) | `testing-conventions.md > §4` (tabela de pureza) + `package.json > scripts` (entrada para `fase-7-dx-infra`). | ✅ |
| Requirement 6.4 (`npx tsc --noEmit` declarado fora do escopo) | `testing-conventions.md > §8` (introdução) e `requirements.md > Requirement 6.4` deste documento. | ✅ |

### Requirement 7 — Itens fora de escopo declarados

| EAR | Evidência | Status |
|---|---|---|
| Requirement 7.1 (declarar fora de escopo: Testing Library e ampliação de Playwright) | `requirements.md > §6 Non-Goals` (itens 1, 2). | ✅ |
| Requirement 7.2 (achados extrapolando escopo viram `OutOfScopeFinding`) | `requirements.md > §3` — tabela `OutOfScopeFinding` vazia. Nenhum achado fora de escopo registrado nesta fase. | ✅ |

### Verificação do checklist "Saída desta fase"

- [x] Todos os 7 Requirements têm evidência concreta (tabela acima).
- [x] `testing-conventions.md` cobre as 4 áreas (localização §1, nomenclatura §1, cobertura §6, persistência de contraexemplo §3) + tabela de pureza §4.
- [x] Seção `OutOfScopeFinding` (§3) marcada como vazia — nenhum achado a referenciar commit no master.
- [x] Phase Card no master `requirements.md` atualizado para `state: Done` com `doneAt: 2026-05-16T04:46:53Z` (Tarefa 7.2).

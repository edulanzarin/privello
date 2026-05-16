# Design Document — `fase-2-testes`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **infraestrutura de testes** (Vitest + fast-check) será montada e quais são as superfícies de teste alvo. A execução das tarefas deste design vive em `tasks.md` (a ser produzido depois).

## Overview

Hoje o projeto tem zero testes unitários e zero testes baseados em propriedade. A única infraestrutura de teste presente é Playwright (`@playwright/test` + `playwright.config.ts` + scripts `test:e2e*`), focada em fluxos end-to-end.

A Fase 2 **adiciona** o caminho de testes unit/property em paralelo ao Playwright, sem tocar nele. O resultado tem três entregas concretas:

1. **Runner instalado**: Vitest + fast-check pinados em `package.json`, `vitest.config.ts` na raiz, três scripts npm (`test`, `test:watch`, `test:run`).
2. **Convenções aplicadas**: `*.test.ts` co-localizado, `*.pbt.ts` para property-based, regra de persistência de contraexemplos. Documento `testing-conventions.md` no diretório do spec-filho.
3. **Cobertura inicial dos módulos puros**: pelo menos um `.test.ts` por módulo identificado como puro em `src/lib/`, e pelo menos um `.pbt.ts` por par `(parse, serialize)` identificado.

A fase **não** entrega CI (Fase 7), **não** entrega cobertura de componentes React (fase futura), **não** modifica código de aplicação para "tornar testável" (qualquer refactor desse tipo vira `OutOfScopeFinding` para Fase 3 ou 7).

### Decisões de design importantes

- **Vitest, não Jest.** Justificativa: zero overhead de configuração com TypeScript, paralelismo nativo, API compatível com Jest (`describe`/`it`/`expect`/`vi.mock`), suporte first-class a ESM. O ecossistema Next 16 + TS 5 + ES2022 já é o ambiente onde Vitest opera melhor. Jest exigiria `ts-jest` ou `babel-jest`, que adicionam superfície de configuração que não traz valor para módulos puros.
- **Environment `node`, não `jsdom`.** Os módulos alvo desta fase (`discover-params`, `booking-slots`, `time-utils`, `money`, `whatsapp-booking`, `utils`, `constants`) não tocam DOM. Configurar `jsdom` carrega complexidade que será exigida só na fase futura de Testing Library para componentes React.
- **fast-check 3.x sem fork customizado.** Versão atual da biblioteca tem suporte oficial a Vitest (`@fast-check/vitest`). Vamos usar a integração oficial.
- **Pinning estrito de versões.** `package.json` deste projeto já mistura `^` e versões pinadas (`next: 16.2.6`, `prisma: 5.22.0` pinados; `clsx: ^2.1.1` flutua). Para o ecossistema de teste vamos pinar exatamente, porque um upgrade silencioso de Vitest pode quebrar a CI da Fase 7 sem aviso.
- **Sem Testing Library, sem `jsdom`, sem mock do Prisma.** Tudo isso pertence a fases futuras. Se durante a execução um teste exigir uma dessas peças, isso vira `OutOfScopeFinding`, não absorção silenciosa.
- **Coverage como meta declarada, não como gate.** Fase 2 declara meta de 80% statements/branches em módulos puros e mede; Fase 7 transforma em gate na CI. Forçar gate aqui antes de F7 cria pressão para escrever testes superficiais.

### O que está fora de escopo

Itens que poderiam parecer naturais nesta fase mas pertencem a outras:

- Testes para `auth.ts`, `prisma.ts`, `queries.ts`, `mercadopago.ts`, `email.ts`. Não puros. Quando essas superfícies forem refatoradas (Fase 1, Fase 3), os testes correspondentes nascem na fase responsável pela mudança.
- Mock de Prisma (`prisma-mock`, `vitest-mock-extended` etc.). Sem caso de uso real até alguma fase posterior precisar.
- Mock de `next/headers`, `next/cache`, server actions. Pertencem à fase que tocar essas APIs (e que tem `agents_rule_areas` declarado).
- Snapshot tests. Fase futura quando houver UI a ser snapshotada.
- Cobertura de `src/app/**`, `src/components/**`. Componentes React, fora desta fase.
- Configuração de pipeline de CI (lint+typecheck+test). Esse é o entregável principal de Fase 7.

## Architecture

```
+-- package.json
|     scripts: test, test:watch, test:run
|     devDependencies: vitest, @vitest/coverage-v8, fast-check, @fast-check/vitest
|
+-- vitest.config.ts                    (novo, na raiz)
|     environment: node
|     include:  src/**/*.{test,pbt}.ts
|     exclude:  tests/e2e/**, node_modules/**, .next/**
|     coverage: provider=v8, reporter=[text, html]
|
+-- src/
|   +-- lib/
|       +-- discover-params.ts          (sob teste)
|       +-- discover-params.test.ts     (novo)
|       +-- discover-params.pbt.ts      (novo, se par parse/serialize)
|       +-- booking-slots.ts            (sob teste)
|       +-- booking-slots.test.ts       (novo)
|       +-- booking-slots.pbt.ts        (novo, se aplicável)
|       +-- time-utils.ts               (sob teste)
|       +-- time-utils.test.ts          (novo)
|       +-- time-utils.pbt.ts           (novo, se aplicável)
|       +-- money.ts                    (sob teste)
|       +-- money.test.ts               (novo)
|       +-- money.pbt.ts                (novo, se aplicável)
|       +-- whatsapp-booking.ts         (sob teste)
|       +-- whatsapp-booking.test.ts    (novo)
|       +-- whatsapp-booking.pbt.ts     (novo, se aplicável)
|       +-- utils.ts                    (sob teste se classificado como puro)
|       +-- constants.ts                (provável puro mas tipicamente sem lógica testável)
|
+-- .kiro/specs/fase-2-testes/
      +-- testing-conventions.md        (novo, doc do spec-filho)
```

### Boundaries

- **Vitest config vs Playwright config**: arquivos separados (`vitest.config.ts` na raiz, `playwright.config.ts` já existe na raiz). `include`/`exclude` evitam que rodem na pasta um do outro.
- **Test runner vs build**: `test` não toca o build. `next build` continua exatamente como está.
- **Source vs test**: testes co-localizados (`x.ts` ↔ `x.test.ts`/`x.pbt.ts`). `tsconfig.json` precisa cobrir esses arquivos para que o TS reconheça os tipos do Vitest. Vamos confirmar e, se necessário, adicionar `vitest/globals` em `compilerOptions.types`.

## Components and Interfaces

### 1. Vitest configuration

```ts
// vitest.config.ts (esboço)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,pbt}.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/**/*.pbt.ts"],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

```ts
// vitest.setup.ts (esboço)
import { fc } from "@fast-check/vitest";

// fast-check default verbosity para imprimir seed reprodutível em falhas
fc.configureGlobal({ verbose: 2, numRuns: 100 });
```

> **Observação**: o esboço usa `setupFiles` para configurar fast-check globalmente. Se durante a implementação se descobrir que isso interfere com testes determinísticos, mover para um helper importável (`src/lib/__test-helpers__/pbt-config.ts`) e remover de `setupFiles`. Decisão registrada em `tasks.md`.

### 2. npm scripts

| Script | Comando | Quando usar |
|---|---|---|
| `test` | `vitest --run` | CI, validações pontuais. Termina com código 0/≠0. |
| `test:watch` | `vitest` | Desenvolvimento local. Re-roda em mudança de arquivo. |
| `test:run` | `vitest --run --reporter=verbose` | Diagnóstico, lista cada caso. |

Todos os scripts pré-existentes (`dev`, `build`, `start`, `lint`, `test:e2e`, `test:e2e:ios`, `test:e2e:desktop`, `postinstall`, `db:*`) ficam intactos. Renomear `test` (caso já estivesse usado para Playwright) implicaria revisar `package.json` antes — verificado: hoje não existe script chamado `test`, só `test:e2e*`.

### 3. Convenções

Documentadas em `testing-conventions.md` dentro do spec-filho. Resumo do contrato:

- **Localização**: teste co-localizado com o código (`src/lib/money.ts` ↔ `src/lib/money.test.ts`).
- **Sufixos**:
  - `*.test.ts` — testes determinísticos com casos.
  - `*.pbt.ts` — testes baseados em propriedade com `fc.assert`/`fc.property` (via `@fast-check/vitest`).
- **Nomes**: `describe("<modulo>", ...)` no topo; `it("<comportamento>", ...)` em pt-BR para legibilidade do output.
- **Imports**: paths alias quando existir (`@/lib/...`); fallback para path relativo curto.
- **Tamanho**: arquivos com mais de 400 linhas são candidatos a quebra (`money.format.test.ts`, `money.parse.test.ts`).
- **Persistência de contraexemplo**: dois caminhos válidos (inline como `it("regression: ...")` ou arquivo dedicado `<modulo>.regressions.ts` consumido por `describe.each`).

### 4. Classificação de pureza

A tabela abaixo é a base para decidir o que vira teste e onde. Validar caso a caso ao executar (lendo o módulo).

| Arquivo | Classificação esperada | Justificativa |
|---|---|---|
| `src/lib/discover-params.ts` | puro | Manipulação de URLSearchParams ↔ filtros. Bom candidato a round-trip. |
| `src/lib/booking-slots.ts` | puro | Cálculo de slots de agendamento. Sem rede, sem disco. |
| `src/lib/time-utils.ts` | puro | Formatação/parse de tempo. Bom candidato a round-trip. |
| `src/lib/money.ts` | puro | Conversão centavos ↔ string. Bom candidato a round-trip. |
| `src/lib/whatsapp-booking.ts` | puro | Constrói URL de booking. Bom candidato a round-trip se houver parse reverso. |
| `src/lib/utils.ts` | provável puro | Validar caso a caso; em geral helpers (`cn`, `clsx`). |
| `src/lib/constants.ts` | puro mas trivial | Constantes; raramente vale teste, exceto se houver derivações computadas. |
| `src/lib/auth.ts` | NÃO puro | NextAuth + Prisma. Fora desta fase. |
| `src/lib/prisma.ts` | NÃO puro | Singleton de cliente. Fora. |
| `src/lib/queries.ts` | NÃO puro | Acesso direto ao Prisma. Fora desta fase; testes nascem na Fase 3. |
| `src/lib/mercadopago.ts` | NÃO puro | SDK externo. Fora. |
| `src/lib/email.ts`, `email-templates.ts` | NÃO puro / parcial | Email tem efeito; templates podem ter parte pura, mas validar caso a caso. Provável `OutOfScopeFinding`. |

### 5. Property-based: pares parse/serialize

Para cada par `(parse, serialize)` ou `(encode, decode)` identificado num módulo puro, a Fase 2 entrega ao menos uma propriedade `parse(serialize(x)) === x` em arquivo `<modulo>.pbt.ts`. Ex.:

```ts
// src/lib/money.pbt.ts (esboço)
import { test } from "@fast-check/vitest";
import { fc } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { centsToBRL, brlToCents } from "@/lib/money";

describe("money round-trip", () => {
  test.prop([fc.integer({ min: 0, max: 99_999_900 })])(
    "centsToBRL ∘ brlToCents == identity",
    (cents) => {
      expect(brlToCents(centsToBRL(cents))).toBe(cents);
    },
  );
});
```

Quando o par não existe em um módulo da lista, registramos isso em `testing-conventions.md` e não criamos `.pbt.ts` artificial.

### 6. Cobertura

Cobertura é meta documentada, não gate (a transformação em gate fica para Fase 7).

- Fonte: `vitest --coverage` com provider `v8`.
- Foco: `src/lib/**/*.ts` excluindo arquivos de teste.
- Meta inicial: 80% statements/branches por módulo puro.
- Onde a meta não bater após esta fase, registramos a contagem real em `testing-conventions.md` com justificativa, sem bloquear a entrega.

## Data Models

A fase não cria nem altera modelos de dados da aplicação. Os "modelos" relevantes aqui são os artefatos textuais produzidos pelo spec-filho, todos em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\`:

- `requirements.md` — já existe (proveniência, EARS herdados, 7 Requirements).
- `design.md` — este documento.
- `tasks.md` — produzido a seguir.
- `testing-conventions.md` — produzido durante a execução das tarefas (entrega obrigatória dos Requirements 2 e 3 do spec-filho).

## Error Handling

- **Teste lento** (>30s): suspeitar de I/O acidental num módulo classificado como puro. Investigar e: (a) re-classificar como não-puro e remover do escopo; (b) extrair a parte pura para módulo separado e testar essa. Caso (a) é `OutOfScopeFinding`.
- **Falha de propriedade reproduzível**: persistir contraexemplo conforme convenção. A própria propriedade vira o teste de regressão.
- **Falha de propriedade não reproduzível** (depende de ambiente): erro de teste, não de código. Rever o gerador (provavelmente `fc.date()` sem fixar timezone, ou similar).
- **Conflito com `tsconfig.json`**: `vitest/globals` em `compilerOptions.types` se faltar. Se isso colidir com tipos do Next, usar import explícito (`import { test, expect } from "vitest"`) e omitir `globals`.
- **Conflito com Playwright** (`tests/e2e/**` rodando em Vitest): excluído por `vitest.config.ts > exclude`. Se Playwright tentar incluir `*.test.ts` co-localizados, ajustar `playwright.config.ts > testMatch` (caso surja).
- **Mudança de versão de Vitest** rompendo CI: versões pinadas mitigam. Atualizações mudam de risco e precisam ser feitas com PR dedicado.

## Testing Strategy

A Fase 2 **é** a estratégia de testes. Esta seção descreve como validar a entrega dela:

- **Smoke local**: `npm install` + `npm run test` em ambiente limpo deve terminar com código 0 e relatar pelo menos 1 caso por módulo puro classificado.
- **Smoke de property-based**: `npm run test -- src/lib/<modulo>.pbt.ts` roda fast-check com `numRuns: 100` e termina sem erro.
- **Smoke de cobertura**: `npx vitest --coverage --run` produz relatório textual e HTML em `coverage/`.
- **Sem regressão na CI Playwright**: `npm run test:e2e` continua funcionando inalterado (verificar uma vez).
- **Reprodutibilidade**: cada `*.pbt.ts` que fixar seed registra a seed em comentário; rodar com `--seed=<seed>` reproduz a mesma sequência.

A Fase 2 não usa fast-check para se autovalidar (não há "propriedades" sobre o setup do runner); a validação é a passagem dos testes alvo dos módulos puros.

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre as 7 EARS de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar (`vitest.config.ts`, `vitest.setup.ts`, scripts em `package.json`, `*.test.ts` e `*.pbt.ts` por módulo puro, `testing-conventions.md`).
- Declara a meta de cobertura sem transformá-la em gate.
- Aponta o que vira `OutOfScopeFinding` (mock de Prisma, Testing Library, configuração de CI).

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com dependências.


## Correctness Properties

As propriedades a seguir nascem como artefatos desta fase quando os respectivos pares parse/serialize são confirmados durante a execução. Cada Property é candidata a virar arquivo `<modulo>.pbt.ts` com `fc.assert(fc.property(...))`. Pares ausentes (função inversa não declarada no módulo) ficam documentados em `testing-conventions.md` em vez de virar `.pbt.ts` artificial.

### Property 1: Money round-trip

**Validates: Requirements 4.1, 4.3**

Para todo `cents ∈ [0, 99_999_900]`, `brlToCents(centsToBRL(cents)) === cents`.

A bound superior 99 999 900 reflete o limite usado em validação financeira do projeto (preços em centavos cf. spec arquivado `backend-performance-phase5`). `brlToCents` e `centsToBRL` precisam de fato existir em `src/lib/money.ts` para a propriedade ser declarável.

### Property 2: Discover-params round-trip

**Validates: Requirements 4.1, 4.3**

Para todo conjunto de filtros válidos `f` (cidade, distrito, tipo de serviço, preço mínimo/máximo, etc.), `parseDiscoverParams(serializeDiscoverParams(f))` é equivalente a `f` (igualdade estrutural).

Equivalência estrutural permite tolerância a normalizações esperadas (chaves vazias removidas, ordem alfabética). O detalhe da equivalência fica congelado no momento em que o teste for escrito.

### Property 3: Time-utils round-trip

**Validates: Requirements 4.1, 4.3**

Para todo `Date d` no intervalo do fuso configurado pelo app, `parseTime(formatTime(d))` produz um `Date` cuja diferença para `d` é menor que a precisão declarada de `formatTime` (tipicamente 1 minuto).

A propriedade reconhece perda de precisão se `formatTime` arredonda; ela exige que a perda seja **limitada e declarada**, não silenciosa.

### Property 4: WhatsApp booking URL round-trip

**Validates: Requirements 4.1, 4.4**

WHERE existir uma função inversa (`parseBookingUrl`) em `src/lib/whatsapp-booking.ts`, para todo payload válido `p`, `parseBookingUrl(buildBookingUrl(p)) === p`.

Caso a função inversa não exista, esta Property é registrada como **não declarável** em `testing-conventions.md` e nenhum `.pbt.ts` é criado para o módulo.

### Property 5: Booking-slots monotonicidade

**Validates: Requirements 3.2**

Para toda combinação válida de `(janela, duração, intervalo)`, a sequência de slots produzida por `generateSlots(...)` é estritamente crescente em `start` e cada slot tem `end > start`.

A propriedade enuncia uma invariante simples (ordenação) que cobre regressões comuns sem prescrever a implementação exata.

### Property 6: Booking-slots completude

**Validates: Requirements 3.2**

Para toda combinação válida de `(janela, duração=d, intervalo=0)`, a união dos slots gerados cobre exatamente `[início, fim − d]` sem lacunas e sem sobreposição.

Caso o módulo permita intervalo entre slots `> 0`, a propriedade ajusta a igualdade para "união dos slots ⊆ [início, fim − d]" e adiciona invariante de espaçamento. A forma final fica congelada quando o teste for escrito.

> Nenhuma destas Properties é exigida para considerar a fase concluída — a meta é uma propriedade round-trip por par parse/serialize **identificado** (Requirement 4 do `requirements.md`). Pares não identificáveis após leitura do módulo viram nota textual no `testing-conventions.md`, não viram arquivo de teste.

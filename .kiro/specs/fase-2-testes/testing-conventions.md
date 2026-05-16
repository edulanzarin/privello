# Testing Conventions — `fase-2-testes`

> Documento canônico de convenções de teste produzido pela Tarefa 2.1 deste spec-filho.
> Cobre localização, nomenclatura, exemplos, persistência de contraexemplos, classificação de pureza de `src/lib/`, pares parse/serialize identificados e meta de cobertura.
>
> Spec-filho: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\`
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\`

---

## 1. Localização e nomenclatura

### Co-localização

Testes ficam **ao lado** do módulo testado, no mesmo diretório:

```
src/lib/money.ts
src/lib/money.test.ts        ← testes determinísticos
src/lib/money.pbt.ts         ← testes baseados em propriedade
```

Não criamos pasta `__tests__/` nem `tests/` para unit/property. A pasta `tests/e2e/` existe para Playwright e fica isolada (`vitest.config.ts > test.exclude` cobre `tests/e2e/**`).

### Sufixos

| Sufixo | Conteúdo | Runner |
|---|---|---|
| `*.test.ts` | Casos determinísticos com `describe` / `it` / `expect`. | Vitest |
| `*.pbt.ts` | Property-based via `@fast-check/vitest` (`test.prop` / `fc.assert`). | Vitest |

`*.pbt.ts` é uma convenção local desta fase — Vitest não diferencia, ele apenas inclui ambos via `test.include = ["src/**/*.{test,pbt}.ts"]` em `vitest.config.ts`. O sufixo serve para identificar à primeira vista que um arquivo carrega geradores fast-check, tem custo de CPU mais alto e tende a expor seeds de regressão.

### Imports

Preferir o alias do projeto:

```ts
import { brlToCents, centsToBRL } from "@/lib/money";
```

O alias `@/*` aponta para `./src/*` (`tsconfig.json > compilerOptions.paths`) e é resolvido em runtime pelo plugin `vite-tsconfig-paths` registrado em `vitest.config.ts`. Quando o alias não estiver disponível, usar caminho relativo curto:

```ts
import { brlToCents, centsToBRL } from "./money";
```

### Tamanho de arquivo

Arquivos de teste com mais de ~400 linhas são candidatos a quebra por área:

```
money.format.test.ts
money.parse.test.ts
money.boundaries.test.ts
```

A quebra é orientada pela API testada, não pelo número de testes. Não há lint que bloqueie nesta fase — é orientação para revisão de código.

### Globals do Vitest

Usamos **imports explícitos**, NÃO `vitest/globals`:

```ts
import { describe, it, expect } from "vitest";
```

Para property-based, importar de `@fast-check/vitest`:

```ts
import { test, fc } from "@fast-check/vitest";
```

Justificativa registrada em `notes.md > tsconfig validation` (produzido pela Tarefa 1.5): omitir `vitest/globals` mantém `compilerOptions.types` enxuto e evita colisão com tipos do Next 16.

### Isolamento Vitest ↔ Playwright

Os dois runners não devem coletar os mesmos arquivos. A separação é declarada em ambas as configs e validada pela Tarefa 1.6.

**Vitest** (`vitest.config.ts`):

- `test.include = ["src/**/*.{test,pbt}.ts"]` — só pega arquivos co-localizados em `src/`.
- `test.exclude = ["tests/e2e/**", "node_modules/**", ".next/**"]` — exclui explicitamente a árvore do Playwright.

**Playwright** (`playwright.config.ts`):

- `testDir: "./tests/e2e"` — restringe a coleção ao subdiretório de E2E. Como o Vitest não emite testes lá e o Playwright nunca olha para fora desse `testDir`, sufixos `*.test.ts` ou `*.pbt.ts` em `src/**` ficam fora do alcance do Playwright por construção.
- Não foi necessário um `testMatch` adicional nesta fase. Caso futuras tarefas adicionem arquivos `*.test.ts` dentro de `tests/e2e/` (ex.: helpers de E2E nomeados acidentalmente assim), revisitar aqui e introduzir `testMatch: "**/*.spec.ts"`.

**Validação executada (Tarefa 1.6):**

Comando: `npx playwright test --list` na raiz do repo (`c:\Users\edulanzarin\Documents\Dev\privello\`).

Saída (excerto, apenas primeiros itens — total `30 tests in 2 files`):

```text
Listing tests:
  [ios-safari] › ios-bug-condition.spec.ts:114:9 › Property 1: iOS Safari touch interactions on non-secure origin › citySuggest mounts a dropdown with options after typing >= 2 chars
  [ios-safari] › ios-bug-condition.spec.ts:200:9 › Property 1: iOS Safari touch interactions on non-secure origin › storyTap mounts the story viewer overlay within 1s of tapping a circle
  [ios-safari] › preservation.spec.ts:145:13 › Preservation 3.1 — desktop city autocomplete still shows suggestions › renders dropdown options for query "São P"
  ...
  [desktop-chrome] › preservation.spec.ts:539:9 › Preservation 3.5 — iOS Safari unrelated features unchanged › login page renders the email + password form

Total: 30 tests in 2 files
```

Os "2 files" são exatamente `tests/e2e/ios-bug-condition.spec.ts` e `tests/e2e/preservation.spec.ts`. Nenhum `src/**/*.test.ts` ou `src/**/*.pbt.ts` aparece — tanto porque o `testDir` do Playwright aponta para `tests/e2e` quanto porque, no momento desta validação, ainda não havia `*.test.ts`/`*.pbt.ts` em `src/**` (são produzidos pelas Tarefas 3.x e 4.x). A regra fica documentada para que a separação se mantenha quando esses arquivos forem criados.

Não foi feita alteração em `playwright.config.ts` na Tarefa 1.6 — a config já estava restritiva o suficiente.

---

## 2. Exemplos canônicos

### `*.test.ts` — gabarito (adaptar à API real do módulo)

```ts
// src/lib/money.test.ts
import { describe, it, expect } from "vitest";
import { brlToCents, centsToBRL } from "@/lib/money";

describe("money", () => {
    describe("centsToBRL", () => {
        it("formata zero centavos como 'R$ 0,00'", () => {
            expect(centsToBRL(0)).toBe("R$ 0,00");
        });

        it("formata 199 centavos como 'R$ 1,99'", () => {
            expect(centsToBRL(199)).toBe("R$ 1,99");
        });

        it("formata 99_999_900 centavos sem perda de precisão", () => {
            expect(centsToBRL(99_999_900)).toBe("R$ 999.999,00");
        });
    });

    describe("brlToCents", () => {
        it("aceita string vazia retornando 0 (ou ajustar conforme contrato real)", () => {
            expect(brlToCents("")).toBe(0);
        });

        it("rejeita input mal-formatado", () => {
            expect(() => brlToCents("não é dinheiro")).toThrow();
        });
    });
});
```

### `*.pbt.ts` — gabarito (usa `@fast-check/vitest`)

```ts
// src/lib/money.pbt.ts
// seed default; quando fixar uma seed reprodutível, registrar aqui:
//   seed: 1701234567 (run que produziu o contraexemplo X em YYYY-MM-DD)
import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { brlToCents, centsToBRL } from "@/lib/money";

describe("money round-trip", () => {
    test.prop([fc.integer({ min: 0, max: 99_999_900 })])(
        "brlToCents ∘ centsToBRL == identity",
        (cents) => {
            expect(brlToCents(centsToBRL(cents))).toBe(cents);
        },
    );
});
```

Observações sobre os snippets:

- São **gabaritos** — adaptar os imports e nomes às funções que de fato existirem em cada módulo. Tarefas 3.x e 4.x preenchem os arquivos reais.
- `numRuns: 100` e `verbose: 2` vêm do `vitest.setup.ts` global; não repetir por arquivo a menos que se queira sobrescrever.
- `test.prop` é o atalho idiomático do `@fast-check/vitest`. Equivale a `fc.assert(fc.property(...))` mas integra com o relatório do Vitest.

---

## 3. Persistência de contraexemplos

Quando um teste de propriedade falha, o fast-check imprime um contraexemplo minimizado e a seed que o produziu (graças a `verbose: 2`). Para evitar que a mesma quebra passe duas vezes, **persistir o contraexemplo** segundo um dos dois caminhos abaixo.

### Caminho A — Inline

Contraexemplo pequeno vira um caso `it("regression: ...")` no mesmo arquivo `.pbt.ts` (ou no `.test.ts` correspondente), com comentário citando a seed:

```ts
// regression: failure observada em 2026-03-14, seed=1742056800123
it("regression: brlToCents preservou centavos para input limítrofe 99_999_900", () => {
    expect(brlToCents(centsToBRL(99_999_900))).toBe(99_999_900);
});
```

### Caminho B — Dedicado

Contraexemplo grande ou conjunto de regressões: criar `<modulo>.regressions.ts` exportando um array nomeado, consumido por `describe.each`:

```ts
// src/lib/money.regressions.ts
export const KNOWN_REGRESSIONS = [
    { label: "limite superior", input: 99_999_900, seed: 1742056800123 },
    { label: "centavo isolado", input: 1, seed: 1742060000000 },
] as const;
```

```ts
// src/lib/money.test.ts
import { describe, it, expect } from "vitest";
import { brlToCents, centsToBRL } from "@/lib/money";
import { KNOWN_REGRESSIONS } from "@/lib/money.regressions";

describe.each(KNOWN_REGRESSIONS)(
    "money regression: $label (seed=$seed)",
    ({ input }) => {
        it("brlToCents ∘ centsToBRL preserva o valor", () => {
            expect(brlToCents(centsToBRL(input))).toBe(input);
        });
    },
);
```

### Reproduzir uma seed específica

```bash
npx vitest --run --seed=1742056800123
```

A seed faz com que os geradores aleatórios de fast-check rodem na mesma sequência da run original. Útil para reproduzir falhas intermitentes localmente antes de persistir o contraexemplo.

### Responsabilidade

Persistência de contraexemplo é **responsabilidade do desenvolvedor**. Nesta fase NÃO há lint que bloqueie commit por contraexemplo não persistido. Gate automatizado (se vier) entra em `fase-7-dx-infra`.

---

## 4. Pureza dos módulos de `src/lib/`

Tabela inicial baseada em `design.md > Components and Interfaces > §4`. A confirmação caso a caso é entregue pela Tarefa 3.1 (lendo cada módulo). `parcial` significa que parte do módulo é pura e testável e parte tem efeito.

| Arquivo | Classificação | Justificativa |
|---|---|---|
| `src/lib/discover-params.ts` | `pure` | Manipulação de `URLSearchParams ↔ filtros`. Sem rede, sem disco. Candidato a round-trip. |
| `src/lib/booking-slots.ts` | `pure` | Geração de slots de agendamento a partir de `(janela, duração, intervalo)`. Sem efeitos. |
| `src/lib/time-utils.ts` | `pure` | Formatação e parsing de tempo. Candidato a round-trip. |
| `src/lib/money.ts` | `pure` | Conversão centavos ↔ string formatada. Candidato a round-trip. |
| `src/lib/whatsapp-booking.ts` | `pure` | Constrói URL de booking a partir de payload. Round-trip condicional à existência de função inversa. |
| `src/lib/utils.ts` | `pure` (provável) | Helpers genéricos (`cn`/`clsx`-style). Validar caso a caso na Tarefa 3.1. |
| `src/lib/constants.ts` | `pure` | Constantes. Raramente vale teste, exceto se houver derivação computada. |
| `src/lib/auth.ts` | `non-pure` | NextAuth + Prisma. Fora desta fase; entra em fase que tocar a superfície. |
| `src/lib/prisma.ts` | `non-pure` | Singleton de cliente Prisma. Fora. |
| `src/lib/queries.ts` | `non-pure` | Acesso direto ao Prisma. Fora desta fase; testes nascem em `fase-3-backend`. |
| `src/lib/mercadopago.ts` | `non-pure` | SDK externo (HTTP). Fora. |
| `src/lib/email.ts` | `non-pure` | Envio efetivo de email. Fora. |
| `src/lib/email-templates.ts` | `parcial` | Templates podem ter parte pura (renderização de string a partir de input); validar na Tarefa 3.1 e, se houver parte testável, decidir se entra nesta fase ou vira `OutOfScopeFinding`. |

> Os subdiretórios `src/lib/hooks/`, `src/lib/security/`, `src/lib/services/` e o módulo `src/lib/rate-limit.ts` não estão no escopo declarado de Pure_Modules em `requirements.md > Glossary`. Avaliação caso a caso fica para fases consumidoras.

---

## 5. Pares parse/serialize identificados

> **Preenchida durante a Tarefa 4.1.** Lista esperada (a confirmar lendo cada módulo):
>
> - `discover-params` — `parseDiscoverParams ↔ serializeDiscoverParams` (URLSearchParams ↔ filtros).
> - `time-utils` — `parseTime ↔ formatTime` (string ↔ Date, com precisão declarada).
> - `money` — `brlToCents ↔ centsToBRL` (string formatada ↔ centavos).
> - `whatsapp-booking` — `parseBookingUrl ↔ buildBookingUrl` se a inversa existir; caso contrário, par marcado como **não declarável** (Property 4 do `design.md` cai).
> - `booking-slots` — sem par parse/serialize óbvio; cobertura via Properties 5 e 6 (monotonicidade e completude).
>
> A Tarefa 4.1 substitui esta nota por entradas confirmadas com path:linha.

---

## 6. Cobertura

### Meta declarada

**80% statements / 80% branches** por módulo classificado como `pure` na seção 4 desta página.

### Medição

```bash
npx vitest --coverage --run
```

Provider: `v8`. Reporters: `text` (saída no terminal) e `html` (relatório navegável em `coverage/index.html`). Configuração em `vitest.config.ts > test.coverage`.

### Não é gate nesta fase

A meta é **declarada e medida**, mas não é gate de CI nesta fase. Onde a meta não bater após a entrega, registramos a contagem real e a justificativa em `Cobertura inicial medida` (subseção abaixo) sem bloquear o spec.

Transformar a meta em gate (failing build quando coverage cair abaixo de 80%) é entrega de `fase-7-dx-infra`.

### Cobertura inicial medida

> **Preenchida na Tarefa 5.1.** Conterá log textual de `npx vitest --coverage --run` capturado uma vez ao final da fase, com uma linha por módulo puro indicando statements/branches medidos. Onde a meta não bater, justificativa textual logo abaixo da linha.

---

## 6.5 ESLint coverage de `*.test.ts` / `*.pbt.ts`

> Decisão produzida pela Tarefa 2.2. Cobre o critério `Requirement 2.4` deste spec.

### Estado atual do `eslint.config.mjs`

Citação: `c:\Users\edulanzarin\Documents\Dev\privello\eslint.config.mjs:5-15`.

```js
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
```

A config:

- **Não declara** nenhum bloco `files: [...]` próprio. Isso faz com que ela herde os patterns padrão de `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript`, que cobrem `*.{js,jsx,mjs,cjs,ts,tsx}` em todo o repositório (excluindo apenas o que está em `globalIgnores`).
- **Não declara** `ignores` ou `globalIgnores` entries que excluam `*.test.ts` ou `*.pbt.ts`. As únicas exclusões são `.next/**`, `out/**`, `build/**` e `next-env.d.ts` — nenhuma delas captura os sufixos de teste em `src/**`.

Portanto, **arquivos `src/**/*.test.ts` e `src/**/*.pbt.ts` produzidos pelas Tarefas 3.x e 4.x já entram automaticamente no escopo do ESLint** sob as regras gerais do preset Next + TypeScript. Não há gap de cobertura de lint a corrigir nesta fase.

### Decisão: **A** (inclusão automática, sem alteração de config)

Critérios usados (extraídos do enunciado da Tarefa 2.2):

- A — config atual já lint todos os `*.ts` via padrão permissivo, sem exclusão dos sufixos de teste → `documentar` (esta seção).
- B — config atual exclui os sufixos via `ignores`/`files` restritivos → registrar como `OutOfScopeFinding` para `fase-7-dx-infra`.
- C — adicionar bloco `files: ["src/**/*.{test,pbt}.ts"]` ao `eslint.config.mjs` apenas se for trivial.

Como a leitura do arquivo confirma que **A** é o caso (o preset Next lint os arquivos por default e não há exclusão), **nenhuma edição em `eslint.config.mjs` é executada nesta tarefa**.

### O que fica para `fase-7-dx-infra`

Esta tarefa cobre apenas o **escopo** (quais arquivos o ESLint lê). O que **não** está sendo decidido aqui:

- **Regras específicas de teste** — por exemplo, permitir/exigir `expect.assertions` em `*.pbt.ts`, relaxar `max-lines` para fixtures grandes, plugin equivalente a `eslint-plugin-testing-library` quando a Fase futura introduzir Testing Library, ou desligar `no-magic-numbers` em testes de propriedade.
- **Override blocks** dedicados (`{ files: ["**/*.{test,pbt}.ts"], rules: { ... } }`) só serão necessários quando uma regra real começar a falhar contra os arquivos produzidos pelas Tarefas 3.x e 4.x. Se isso acontecer durante esta fase, vira `OutOfScopeFinding` em `requirements.md > §3` apontando para `fase-7-dx-infra` — segue a regra E4 do `design.md > Error Handling` (sem absorção silenciosa).

A Fase 7 (`fase-7-dx-infra`) é a fase canônica de configuração de DX/lint/CI, e regras específicas de teste pertencem a ela.

---

## 7. Referências cruzadas

- Requisitos desta fase: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\requirements.md`
- Design desta fase: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\design.md`
- Notas operacionais (incluindo `tsconfig validation`): `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\notes.md` _(produzido pelas tarefas 1.x; este documento já cita a seção `tsconfig validation` na §1)_
- Plano de tarefas: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\tasks.md`
- Master spec: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`

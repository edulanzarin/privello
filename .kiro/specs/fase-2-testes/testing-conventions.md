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

O alias `@/*` aponta para `./src/*` (`tsconfig.json > compilerOptions.paths`) e é resolvido em runtime via `resolve.tsconfigPaths: true` do Vite (config nativa, registrada em `vitest.config.ts`). Quando o alias não estiver disponível, usar caminho relativo curto:

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

### Reproduzir uma run com seed fixa

Quando um teste em `*.pbt.ts` falha, o fast-check imprime no relatório do Vitest:

- A **seed** usada na run (inteiro de 64 bits).
- O **path** do shrinker (sequência de passos para minimizar).
- O **contraexemplo minimizado** (já paraphrased pelo shrinker).

Com `verbose: 2` configurado em `vitest.setup.ts > fc.configureGlobal`, esses três campos saem em todo failure. Exemplo de output (campos relevantes — encurtado):

```text
Property failed after 1 tests
{ seed: 1742056800123, path: "0:1:0", endOnFailure: true }
Counterexample: [99999900]
Shrunk 0 time(s)
```

Para **reproduzir essa run**, há três caminhos. Escolha o caminho A para reprodução pontual local, o caminho B para tornar a reprodução permanente em código, ou o caminho C quando precisar fixar a seed para o arquivo inteiro.

#### Caminho A — passar a seed via `fc.assert` num test isolado

Substitua temporariamente o `test.prop` afetado por uma chamada explícita de `fc.assert` com a seed da falha, sem mexer em config global:

```ts
// src/lib/money.pbt.ts (debug local — não comitar com a seed fixa)
import { describe, it } from "vitest";
import { fc } from "@fast-check/vitest";
import { formatBrl } from "@/lib/money";

describe("money round-trip — debug seed=1742056800123", () => {
    it("repro counterexample", () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 99_999_900 }), (cents) => {
                // ... mesma propriedade do test.prop original
            }),
            { seed: 1742056800123, numRuns: 1, endOnFailure: true },
        );
    });
});
```

`numRuns: 1` + `endOnFailure: true` força o fast-check a parar exatamente no contraexemplo, evitando shrinking adicional na reprodução.

#### Caminho B — persistir o contraexemplo (preferido)

Reproduzir uma seed é diagnóstico; persistir o contraexemplo é a correção. Promova o caso reproduzido para um `it("regression: ...")` no `*.test.ts` ou para `<modulo>.regressions.ts`, conforme a §3 acima ("Persistência de contraexemplos"). Esse é o caminho que fica no histórico do repo.

#### Caminho C — `fc.configureGlobal({ seed })` no setup file

Para fixar a seed da run inteira (todos os arquivos `*.pbt.ts`), edite **temporariamente** `vitest.setup.ts`:

```ts
// vitest.setup.ts — uso de debug; reverter antes de comitar
import { fc } from "@fast-check/vitest";

fc.configureGlobal({
    verbose: 2,
    numRuns: 100,
    seed: 1742056800123, // ⚠️ remover antes do commit
});
```

Útil quando a falha só aparece com a sequência exata de geradores produzida pela seed (ex.: arquivo com múltiplos `test.prop` que compartilham state via random). NÃO comitar com `seed` fixo no setup global — Mantém-se aleatório por design (ver `vitest.setup.ts` real e `tasks.md > 1.3`).

#### Sobre `vitest --seed`

`npx vitest --seed=N` existe como flag do Vitest, mas controla apenas o **shuffle de arquivos/testes** quando `test.sequence.shuffle` está ativado. **Não** alimenta a PRNG do fast-check — para reproduzibilidade de geradores property-based use os caminhos A, B ou C acima. Não há variável de ambiente `FC_SEED` reconhecida pelo `@fast-check/vitest` na versão pinada (`0.4.1`).

#### Responsabilidade

Reproduzir uma seed é diagnóstico; persistir o contraexemplo é **responsabilidade do desenvolvedor** (já documentado em "Persistência de contraexemplos" mais acima). Esta seção cobre apenas o passo intermediário — reproduzir o failure localmente antes de promovê-lo a regression case. Nesta fase NÃO há lint que bloqueie commit por contraexemplo não persistido. Gate automatizado (se vier) entra em `fase-7-dx-infra`.

---

## 4. Pureza dos módulos de `src/lib/`

Tabela confirmada pela Tarefa 3.1 lendo cada arquivo no top-level de `src/lib/`. A coluna `Justificativa` cita `path:linha` apontando para a evidência (import, `process.env`, `Date.now()`, `setInterval`, etc.) em entradas `non-pure` ou `parcial`.

`parcial` = parte do módulo é pura e testável; parte tem efeito (clock, env, I/O).

| Arquivo | Classificação | Justificativa |
|---|---|---|
| `src/lib/auth.ts` | `non-pure` | NextAuth + Prisma + bcrypt em `src/lib/auth.ts:1-5`; lê `process.env.NODE_ENV` em `:7` e `process.env.AUTH_URL` em `:14`; `throw` em module-load em `:15` se `AUTH_URL` ausente em produção. Fora desta fase. |
| `src/lib/booking-slots.ts` | `parcial` | Puros: `getWindowForWeekday`, `generateHalfHourStarts`, `filterStartsForDuration`, `resolveDurationOptions`, `calendarMonthCells`, `computeEndTimeLabel`. Não-puros (clock): `isDateBeforeToday` em `src/lib/booking-slots.ts:90-94` chama `startOfTodayLocal()`; `isDateSelectable` em `:96-102` deriva via `isDateBeforeToday`. Import `type` de `@prisma/client` em `:1` é apenas tipo, sem efeito em runtime. |
| `src/lib/constants.ts` | `pure` | Apenas `as const` exports literais (`PLAN_PRICES`, `MAX_UPLOAD_BYTES`, `DAYS_PT`, etc.); nenhuma derivação computada, nenhum `process.env`, nenhum import com efeito. Confirmado em `src/lib/constants.ts:1-46`. |
| `src/lib/discover-params.ts` | `pure` | `parseDiscoverSearchParams` em `src/lib/discover-params.ts:3-41` e `buildDiscoverHref`/`buildDiscoverHrefFromCity` em `:43-66` são determinísticas sobre `Record<string,string>`/`URLSearchParams`. Sem `process.env`, sem I/O. Import de `@/lib/queries` é apenas `type` (`:1`). |
| `src/lib/email-templates.ts` | `pure` | Todas as exportadas são template-string builders puros: `passwordResetTemplate` (`src/lib/email-templates.ts:24`), `warningTemplate` (`:34`), `suspensionTemplate` (`:55`), `unsuspensionTemplate` (`:74`). Helpers internos `base` (`:1`) e `btn` (`:18`) também puros. Sem `process.env`, sem `Date.now()`, sem I/O. |
| `src/lib/email.ts` | `non-pure` | `nodemailer.createTransport` em module-load em `src/lib/email.ts:9-19`; lê `process.env.EMAIL_HOST/USER/PASS/PORT/SECURE/FROM` em `:4-6, 12-17, 30`; `console.log` em `:23`; envio efetivo de email via SMTP em `:25-30`. Fora desta fase. |
| `src/lib/mercadopago.ts` | `non-pure` | Lê `process.env.MERCADOPAGO_ACCESS_TOKEN` em `src/lib/mercadopago.ts:4`; instancia `MercadoPagoConfig` do SDK externo em `:5`; re-export do SDK em `:8`. Fora desta fase. |
| `src/lib/money.ts` | `pure` | `formatBrl(value: number)` em `src/lib/money.ts:1-7` é determinística (apenas `Intl.NumberFormat`, sem `process.env` nem I/O). **Atenção:** este módulo NÃO contém `brlToCents` nem `centsToBRL` previstos por `design.md > Property 1` — ver §5 abaixo (Property 1 marcada como **não declarável**). |
| `src/lib/prisma.ts` | `non-pure` | `new PrismaClient(...)` em module-load em `src/lib/prisma.ts:5-9`; mutação de `globalThis` em `:3, 11`; lê `process.env.NODE_ENV` em `:7, 11`. Singleton com efeito global. Fora desta fase. |
| `src/lib/queries.ts` | `parcial` | Puros: `sortProfileCards` em `src/lib/queries.ts:97-110` e `finalizeDiscoverOrder` em `:114-133` (transformações sobre arrays). Não-puros: import de `prisma` em `:2` e todas as outras funções (`getPlatformStats`, `getCityBySlug`, `listProfilesForCity`, etc.) executam `await prisma.*`. Fora desta fase; testes da camada DB nascem em `fase-3-backend`. |
| `src/lib/rate-limit-config.ts` | `pure` | `RATE_LIMIT_TABLE` em `src/lib/rate-limit-config.ts:23-37` é constante literal `as const`; `rateLimitConfigFor(endpoint, key)` em `:53-63` constrói objeto fresco a partir da tabela. Sem `process.env`, sem I/O. Apenas `import type` em `:13`. |
| `src/lib/rate-limit.ts` | `non-pure` | Lê o relógio via `Date.now()` em `src/lib/rate-limit.ts:131, 142, 226, 233`; agenda `setInterval` em module via construtor de `InMemoryRateLimiterStore` em `:121-127`; lê `process.env.NODE_ENV` em `:114`; mantém `Map` mutável interno em `:97`. Singleton lazy `defaultStore` em `:181-188`. Não puro por design (limiter precisa de clock). |
| `src/lib/time-utils.ts` | `parcial` | Puros: `timeToMinutes` em `src/lib/time-utils.ts:2-8`, `minutesToTime` em `:10-15`, `addMinutesToTime` em `:17-19`, `weekdayFromDate` em `:22-24`, `isSameLocalDay` em `:31-33`, `formatYearMonth` em `:48-50`. Não-puros (clock): `startOfTodayLocal` em `:26-29` chama `new Date()`; `parseMonthParam` em `:35-46` cai em `new Date()` quando o input é inválido/ausente. |
| `src/lib/utils.ts` | `pure` | `cn(...inputs)` em `src/lib/utils.ts:4-6` é wrapper determinístico sobre `clsx + twMerge` (puros). Sem `process.env`, sem I/O. Confirmado: classificação inicial "provável puro" do `design.md` corrigida para `pure` definitivo. |
| `src/lib/whatsapp-booking.ts` | `pure` | `buildWhatsAppBookingMessage` em `src/lib/whatsapp-booking.ts:16-41`, `whatsappDigits` em `:43-48`, `buildWhatsAppUrl` em `:50-53` são determinísticas. Sem `process.env`, sem I/O. Import de `@/lib/money` em `:1` traz apenas a função pura `formatBrl`. |

**Contagem (15 arquivos top-level de `src/lib/`):**

- `pure`: 7 — `constants.ts`, `discover-params.ts`, `email-templates.ts`, `money.ts`, `rate-limit-config.ts`, `utils.ts`, `whatsapp-booking.ts`
- `parcial`: 3 — `booking-slots.ts`, `queries.ts`, `time-utils.ts`
- `non-pure`: 5 — `auth.ts`, `email.ts`, `mercadopago.ts`, `prisma.ts`, `rate-limit.ts`

**Correções vs. classificação inicial do `design.md`:**

- `booking-slots.ts`: `pure` → `parcial` (funções `isDateBeforeToday` e `isDateSelectable` leem o relógio).
- `time-utils.ts`: `pure` → `parcial` (`startOfTodayLocal` e `parseMonthParam` leem o relógio).
- `email-templates.ts`: `parcial` → `pure` (todas as exportadas são puras; nenhum efeito identificado).
- `queries.ts`: `non-pure` → `parcial` (`sortProfileCards` e `finalizeDiscoverOrder` são puras).
- `rate-limit.ts` e `rate-limit-config.ts`: ausentes da tabela original; agora classificados (`non-pure` e `pure` respectivamente).
- `utils.ts`: "provável puro" → `pure` confirmado.

> Os subdiretórios `src/lib/hooks/`, `src/lib/security/`, `src/lib/services/`, `src/lib/validation/` não estão no escopo desta tarefa (top-level apenas). Avaliação caso a caso fica para fases consumidoras.

### 4.1 Decisão sobre `utils.ts` e `constants.ts` (Tarefa 3.7)

| Arquivo | Decisão | Justificativa |
|---|---|---|
| `src/lib/utils.ts` | **Sem `*.test.ts` nesta fase.** | Único export é `cn(...inputs: ClassValue[])` em `src/lib/utils.ts:4-6`, wrapper determinístico de `twMerge(clsx(inputs))`. Testar reproduziria os testes de `clsx` + `tailwind-merge` (ambas libs com cobertura própria upstream). Decisão registrada conforme Tarefa 3.7 do `tasks.md`. Re-avaliar se `utils.ts` ganhar lógica não-trivial em fases futuras. |
| `src/lib/constants.ts` | **Sem `*.test.ts` nesta fase.** | Apenas literais e tuplas `as const` (ver §4 acima e o arquivo em `src/lib/constants.ts`): `PLAN_PRICES`, `*_DURATION_MS`, `MAX_*_BYTES`, `DAYS_PT`, `SITE_URL`, `*_PAGE_SIZE`. Expressões aritméticas (`30 * 24 * 60 * 60 * 1000`) são avaliadas em compile-time pelo TypeScript — não há lógica condicional ou derivação computada que justifique teste de integridade. Decisão registrada conforme Tarefa 3.7 do `tasks.md`. |

---

## 5. Pares parse/serialize identificados

Lista confirmada pela Tarefa 4.1 lendo cada módulo classificado como `pure` ou `parcial` na §4. Cada entrada cita as funções com `path:linha` e mapeia à Property correspondente em `design.md > Correctness Properties`. Pares previstos no `design.md` que NÃO existem no código real ficam marcados como **não declarável** com justificativa.

### 5.1 `src/lib/money.ts` — Property 1 (round-trip BRL ↔ centavos)

**Status: não declarável.**

`design.md > Property 1` previa o par `brlToCents ↔ centsToBRL`. Na leitura do módulo (`src/lib/money.ts:1-7`), o único export é `formatBrl(value: number): string` — uma formatação one-way (number em reais inteiros → string `Intl.NumberFormat("pt-BR", { currency: "BRL", maximumFractionDigits: 0 })`). NÃO existe função inversa que parseia a string formatada de volta para número, e NÃO existe representação em centavos no módulo.

**Consequência:** Property 1 do `design.md > Correctness Properties` é **não declarável** com a API atual. A Tarefa 4.2, que prevê `src/lib/money.pbt.ts`, vai precisar ser revista (sem par, sem `.pbt.ts` artificial). A introdução de `brlToCents`/`centsToBRL` é um `OutOfScopeFinding` candidato para `fase-3-backend` (camada financeira) — registrar em `requirements.md > §3` quando a Tarefa 4.2 chegar.

> **Nota (Tarefa 4.2 executada):** `money.ts` exporta apenas `formatBrl(number) → string`; nenhum parser inverso existe. Round-trip como originalmente especificado em `design.md > Property 1` é **não declarável**. Em vez de pular o módulo, `src/lib/money.pbt.ts` declara um invariante mais fraco que preserva o espírito da Property 1: `formatBrl(value)` começa com `"R$"` e preserva os dígitos de `value` na saída (ignorando NBSP e separador de milhar). Out-of-scope desta fase: introduzir `parseBrl` (ou um par `brlToCents`/`centsToBRL`) destravaria a Property 1 canônica — registrado como **candidato a refactor** para `fase-3-backend` se a camada financeira precisar.

### 5.2 `src/lib/discover-params.ts` — Property 2 (round-trip filtros ↔ URLSearchParams)

**Status: não declarável como round-trip estrito.**

`design.md > Property 2` previa `parseDiscoverParams ↔ serializeDiscoverParams`. Na leitura do módulo:

- `parseDiscoverSearchParams(raw: Record<string, string | string[] | undefined>)` em `src/lib/discover-params.ts:3-41` produz `{ filters, sort, view }`.
- `buildDiscoverHref(citySlug, next, current?)` em `src/lib/discover-params.ts:43-56` e `buildDiscoverHrefFromCity(citySlug, params?)` em `:59-64` constroem URL strings a partir de `Record<string, string | null | undefined>` ou `Record<string, string>` — **não** a partir de `{ filters, sort, view }`.

Os tipos de entrada/saída não casam: `parse` aceita query params crus e devolve objeto tipado; `build*` aceita um `Record<string, string>` arbitrário e devolve string de URL. Não há um `serializeDiscoverParams(filters, sort, view): URLSearchParams` que seja a inversa direta de `parseDiscoverSearchParams`.

**Consequência:** Property 2 como round-trip estrito **não é declarável**. Propriedades alternativas testáveis (idempotência de `buildDiscoverHref` com inputs `null`/`undefined`/`""` apagando chaves; preservação de chaves não tocadas em `current`) são possíveis mas não estão no Property catalog do `design.md` — adicionar nova propriedade exige aprovação do usuário (fora do escopo desta tarefa). A Tarefa 4.3 vai precisar ser revista.

### 5.3 `src/lib/time-utils.ts` — Property 3 (round-trip tempo)

**Status: declarável com escopo ajustado.**

`design.md > Property 3` previa `parseTime ↔ formatTime` operando em `Date`. Na leitura do módulo, o par real é `string ↔ number` (minutos desde meia-noite), não `string ↔ Date`:

- `timeToMinutes(hhmm: string): number` em `src/lib/time-utils.ts:2-8` — parseia `"HH:MM"` para inteiro 0–1439.
- `minutesToTime(total: number): string` em `src/lib/time-utils.ts:10-15` — formata inteiro 0–1439 para `"HH:MM"` com zero-pad.

A relação `minutesToTime(timeToMinutes(s)) === normalize(s)` (com `s` casando `^\d{1,2}:\d{2}$`) é um round-trip declarável; `timeToMinutes(minutesToTime(n)) === ((n % 1440) + 1440) % 1440` para todo `n: number` também é declarável.

**Consequência:** Property 3 é declarável **mas com geradores diferentes** dos previstos no `design.md` (gerador inteiro 0–1439 ou string `HH:MM` válida, NÃO `fc.date()`). A Tarefa 4.4 vai precisar ajustar o enunciado e o gerador. As funções com clock (`startOfTodayLocal`, `parseMonthParam` quando input inválido) ficam fora do round-trip.

### 5.4 `src/lib/whatsapp-booking.ts` — Property 4 (round-trip URL de booking)

**Status: não declarável (conforme antecipado pelo `design.md`).**

`design.md > Property 4` é condicional à existência de `parseBookingUrl`. Lendo `src/lib/whatsapp-booking.ts` na íntegra, os exports são apenas:

- `buildWhatsAppBookingMessage(p: WhatsAppBookingPayload): string` em `src/lib/whatsapp-booking.ts:16-41`
- `whatsappDigits(phone: string | null | undefined): string | null` em `:43-48`
- `buildWhatsAppUrl(phoneDigits: string, message: string): string` em `:50-53`

Nenhuma função inversa (`parseBookingUrl`, `parseWhatsAppBookingMessage` etc.) existe. A construção é one-way (payload → string de mensagem → URL com `encodeURIComponent`).

**Consequência:** Property 4 é **não declarável** — confirmado em código. A Tarefa 4.5 NÃO produz `src/lib/whatsapp-booking.pbt.ts`; o resultado fica documentado nesta seção, conforme o próprio enunciado da tarefa.

**Confirmação na execução da Tarefa 4.5 (condicional):** nenhum arquivo `src/lib/whatsapp-booking.pbt.ts` foi criado. `whatsapp-booking.ts` exporta apenas funções de construção (`buildWhatsAppBookingMessage`, `whatsappDigits`, `buildWhatsAppUrl`); a string final é mensagem freeform sem inversa parseável. Conforme `tasks.md > 4.5` (condicional), Property 4 fica registrada como **NÃO DECLARÁVEL** e a cobertura do módulo é exercida por `src/lib/whatsapp-booking.test.ts` (entrega da Tarefa 3.6) com casos determinísticos sobre as regras de construção da mensagem e da URL.

### 5.5 `src/lib/booking-slots.ts` — Properties 5 e 6 (sem par parse/serialize)

**Status: sem par; cobertura via Properties 5/6 (monotonicidade e completude).**

`booking-slots.ts` é uma camada geradora (`generateHalfHourStarts` em `src/lib/booking-slots.ts:21-27`, `filterStartsForDuration` em `:30-38`, `resolveDurationOptions` em `:50-78`, `calendarMonthCells` em `:80-91`), não inversor. Não há par `parse/serialize` aplicável.

**Consequência:** Properties 5 (monotonicidade da sequência de slots) e 6 (completude da cobertura `[início, fim − duração]`) do `design.md > Correctness Properties` cobrem este módulo via invariantes estruturais, não round-trip. Tarefa 4.6 implementa via `fc.assert` sobre janelas geradas, conforme já enunciado.

### 5.6 Outros módulos com partes puras (fora do catálogo de Properties)

Para registro: módulos `pure`/`parcial` que NÃO estão no catálogo de Properties (1–6) do `design.md` e que TAMBÉM não têm pares parse/serialize:

- `src/lib/constants.ts` — apenas constantes literais.
- `src/lib/email-templates.ts` — quatro builders puros de string HTML (one-way).
- `src/lib/rate-limit-config.ts` — `rateLimitConfigFor(endpoint, key): RateLimitConfig` é construtor one-way a partir de `RATE_LIMIT_TABLE`.
- `src/lib/utils.ts` — `cn(...inputs)` é wrapper determinístico (one-way) sobre `clsx + twMerge`.
- `src/lib/queries.ts > sortProfileCards`/`finalizeDiscoverOrder` — funções puras de ordenação (idempotência declarável, mas fora do catálogo de Properties desta fase).

Nenhum desses entra como `.pbt.ts` nesta fase. Coberturas via `.test.ts` determinísticos ficam a cargo das Tarefas 3.x se aplicável.

### Resumo

| Módulo | Property prevista | Par confirmado? | Status |
|---|---|---|---|
| `money.ts` | Property 1 (`brlToCents ↔ centsToBRL`) | Não | **não declarável** — apenas `formatBrl` one-way em `src/lib/money.ts:1-7` |
| `discover-params.ts` | Property 2 (`parse ↔ serialize`) | Não (assimétrico) | **não declarável como round-trip** — `parse` retorna objeto tipado, `build*` aceita `Record<string,string>` em `src/lib/discover-params.ts:3-64` |
| `time-utils.ts` | Property 3 (`parseTime ↔ formatTime` sobre `Date`) | Sim com escopo diferente | **declarável** — par real é `timeToMinutes ↔ minutesToTime` (`string ↔ number`) em `src/lib/time-utils.ts:2-15` |
| `whatsapp-booking.ts` | Property 4 (condicional) | Não | **não declarável** — sem `parseBookingUrl`, conforme `src/lib/whatsapp-booking.ts:16-53` |
| `booking-slots.ts` | Properties 5/6 (monotonicidade, completude) | N/A (sem par) | **declarável via invariantes**, não round-trip |

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

> Preenchido pela Tarefa 5.1. Comando: `npx vitest --coverage --run` na raiz do repo (`c:\Users\edulanzarin\Documents\Dev\privello\`). 13 arquivos de teste, 118 testes, todos passando. Provider: `v8`. O reporter `text` do v8 agrega/trunca nomes longos no terminal (ex.: `lib/email-templates.ts` aparece como `...-templates.ts`); para precisão por arquivo, os números abaixo vêm do reporter `json-summary` (`coverage/coverage-summary.json`).

#### Relatório textual `text` (v8)

```text
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   38.74 |    29.51 |   28.28 |   40.54 |
 lib               |   35.14 |    31.08 |   34.73 |   35.85 |
  auth.ts          |       0 |        0 |       0 |       0 | 7-87
  constants.ts     |       0 |      100 |     100 |       0 | 2-43
  ...-templates.ts |       0 |        0 |       0 |       0 | 2-77
  email.ts         |       0 |        0 |       0 |       0 | 3-34
  mercadopago.ts   |       0 |        0 |       0 |       0 | 4-5
  prisma.ts        |       0 |        0 |     100 |       0 | 3-11
  queries.ts       |       0 |        0 |       0 |       0 | 4-644
  ...mit-config.ts |       0 |      100 |       0 |       0 | 24-64
  rate-limit.ts    |   65.71 |       60 |   57.14 |   65.71 | ...37,148,162-165
  utils.ts         |       0 |      100 |       0 |       0 | 5
 lib/hooks         |       0 |        0 |       0 |       0 |
  ...escape-key.ts |       0 |        0 |       0 |       0 | 1-21
  ...ile-upload.ts |       0 |        0 |       0 |       0 | 1-74
  ...ia-actions.ts |       0 |        0 |       0 |       0 | 1-60
  ...croll-lock.ts |       0 |        0 |       0 |       0 | 1-17
 lib/security      |   60.86 |    53.52 |   58.82 |   63.41 |
  cron-auth.ts     |   81.13 |     73.8 |      80 |    85.1 | ...25-130,140,176
  dev-auth.ts      |   33.33 |    24.13 |   28.57 |   34.28 | ...18-125,133-138
 lib/services      |       0 |        0 |       0 |       0 |
  city.service.ts  |       0 |        0 |       0 |       0 | 7-74
  media.service.ts |       0 |        0 |       0 |       0 | 8-21
  ...le.service.ts |       0 |        0 |       0 |       0 | 8-52
  ...on.service.ts |       0 |      100 |       0 |       0 | 1-21
 lib/validation    |   67.71 |        0 |       0 |   72.88 |
  _form-utils.ts   |    2.85 |        0 |       0 |     3.7 | 17-57,72-79
  auth.schema.ts   |   88.88 |      100 |       0 |   88.88 | 84
  ...tro.schema.ts |   71.42 |        0 |       0 |   71.42 | 46-47
  mp.schema.ts     |      75 |        0 |       0 |      75 | 14
  ...ing.schema.ts |      80 |      100 |       0 |   88.88 | 67
  ...ngs.schema.ts |   92.85 |        0 |       0 |   92.85 | 15
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 38.74% ( 284/733 )
Branches     : 29.51% ( 121/410 )
Functions    : 28.28% ( 43/152 )
Lines        : 40.54% ( 266/656 )
================================================================================
```

#### Por módulo declarado `pure` ou com porções puras na §4

Tabela consolidada com números por arquivo (fonte: `coverage/coverage-summary.json`). Coluna `Status` indica se a meta declarada de 80% statements e 80% branches foi atingida (✅) ou não (⚠️), com justificativa textual onde aplicável.

| Arquivo | Classificação §4 | Stmts | Branches | Funcs | Status |
|---|---|---|---|---|---|
| `src/lib/booking-slots.ts` | `parcial` | 100% (49/49) | 100% (17/17) | 100% (13/13) | ✅ partes puras 100% cobertas. As funções com clock (`isDateBeforeToday`, `isDateSelectable`) estão exercitadas via testes determinísticos com `vi.useFakeTimers` em `booking-slots.test.ts` |
| `src/lib/constants.ts` | `pure` | 0% (0/19) | 100% (0/0) | 100% (0/0) | ⚠️ módulo só exporta literais `as const`; v8 conta cada exporta como statement não-executado. Tarefa 3.7 documentou explicitamente "sem `*.test.ts` nesta fase" — alvo a re-avaliar em fase-7 (gate de coverage) ou ignorar via `coverage.exclude` se ficar ruidoso |
| `src/lib/discover-params.ts` | `pure` | 100% (26/26) | 100% (34/34) | 100% (4/4) | ✅ |
| `src/lib/email-templates.ts` | `pure` | 0% (0/8) | 0% (0/10) | 0% (0/6) | ⚠️ não exercitado por nenhum `*.test.ts` nesta fase (não está no catálogo de Properties §5.6, nem entrou nas Tarefas 3.x). Os 4 builders são puros; cobertura é alvo de fase-3 (camada de e-mail) ou de uma tarefa futura desta família |
| `src/lib/money.ts` | `pure` | 100% (1/1) | 100% (0/0) | 100% (1/1) | ✅ único export `formatBrl` exercitado por `money.test.ts` e `money.pbt.ts` |
| `src/lib/rate-limit-config.ts` | `pure` | 0% (0/3) | 100% (0/0) | 0% (0/1) | ⚠️ `rateLimitConfigFor` não exercitado por `*.test.ts` nesta fase (não está no catálogo Properties §5.6). Cobertura é alvo de fase-3 ou fase-7 quando a configuração entrar em uso real nos handlers |
| `src/lib/time-utils.ts` | `parcial` | 100% (24/24) | 100% (15/15) | 100% (8/8) | ✅ partes puras (`timeToMinutes`, `minutesToTime`, `addMinutesToTime`, `weekdayFromDate`, `isSameLocalDay`, `formatYearMonth`) cobertas; partes com clock (`startOfTodayLocal`, `parseMonthParam`) exercidas por `time-utils.test.ts` com fake timers |
| `src/lib/utils.ts` | `pure` | 0% (0/1) | 100% (0/0) | 0% (0/1) | ⚠️ `cn` não exercitado por `*.test.ts` nesta fase (decisão registrada em §4.1 — testar reproduziria a cobertura própria de `clsx`/`twMerge`). Não há gap funcional |
| `src/lib/whatsapp-booking.ts` | `pure` | 100% (19/19) | 100% (8/8) | 100% (3/3) | ✅ |
| `src/lib/queries.ts > sortProfileCards`, `finalizeDiscoverOrder` | `parcial` (puros) | 0% (do arquivo: 0/185) | 0% (0/131) | 0% (0/46) | ⚠️ as duas funções puras citadas em §5.6 não foram exercitadas por testes nesta fase. Out-of-scope explícito (fase-3-backend); todas as outras funções do arquivo dependem de `prisma` e ficam em outra fase |
| `src/lib/booking-slots.pbt.ts` (módulo de teste) | n/a | n/a | n/a | n/a | n/a — excluído pelo `coverage.exclude` |

##### Resumo da meta de 80%

- **Atingida (✅):** `booking-slots.ts` (porções puras), `discover-params.ts`, `money.ts`, `time-utils.ts`, `whatsapp-booking.ts`. Cinco módulos pure/parcial cumprem 100% statements e 100% branches no escopo testável.
- **Abaixo da meta (⚠️):** `constants.ts`, `email-templates.ts`, `rate-limit-config.ts`, `utils.ts`, e as funções puras de `queries.ts`. Justificativa registrada por linha. Nenhuma destas é gate nesta fase (fase-2 é declarativa quanto a cobertura — gate efetivo é tarefa de `fase-7-dx-infra`).

##### Módulos `non-pure` (informativo)

`auth.ts`, `email.ts`, `mercadopago.ts`, `prisma.ts`, `rate-limit.ts`, `dev-auth.ts`, `lib/hooks/*`, `lib/services/*` ficam fora do escopo de cobertura desta fase — exigem mocks de infraestrutura ou são hooks de React (fora de Vitest node-only). `rate-limit.ts` aparece com 65.71% por exposição parcial via `rate-limit.pbt.ts` (foco em invariantes de balde token, não em meta de 80%).

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

---

## 8. Contrato com a CI da Fase 7

> Produzido pelas Tarefas 6.1 e 6.2. Esta fase **não pluga CI**; declara o contrato que a `fase-7-dx-infra` precisa honrar quando ligar a pipeline. As preconditions abaixo foram verificadas localmente em `c:\Users\edulanzarin\Documents\Dev\privello\` no momento da entrega.

### 8.1 Pré-condições verificadas

#### `npm run test` é executável sem banco e sem rede

`package.json > scripts.test` resolve para `vitest --run`. A entrega da Fase 2 não introduziu qualquer dependência runtime de Postgres, MercadoPago, SMTP ou rede. Os arquivos `*.test.ts`/`*.pbt.ts` em `src/lib/**` executam contra módulos puros (ou com fake timers para porções com clock), conforme classificação em §4.

**Medição da Tarefa 6.1.** Comando: `npx vitest --run` na raiz do repo.

```text
 RUN  v4.1.6 C:/Users/edulanzarin/Documents/Dev/privello

 Test Files  13 passed (13)
      Tests  118 passed (118)
   Start at  01:40:36
   Duration  4.15s (transform 1.40s, setup 28.26s, import 1.81s, tests 926ms, environment 2ms)

EXIT_CODE=0
WALL_CLOCK_SECONDS=4.92
```

- **Wall-clock total** (Get-Date antes/depois): **4.92 s**.
- **Vitest internal duration**: 4.15 s (test phase 926 ms, setup 28.26 s — o `setup` aqui é tempo de transform/import paralelo do worker pool, não execução serial).
- **Exit code**: 0 (todos os 118 testes em 13 arquivos passaram).
- **Meta declarada de ≤ 60 s**: ✅ confortavelmente abaixo (4.92 s « 60 s).

Reservas: medição feita com `node_modules/.cache` aquecido. Em primeira execução pós-`npm install` o tempo de transform pode subir, mas a margem de 12× para o teto de 60 s é segura.

#### `npm run test` retorna ≠ 0 quando algum teste falha

Contrato estrutural do Vitest, alinhado com Jest e demais runners da família CommonJS/ESM. O comando retorna:

- `0` quando todos os testes passam.
- `1` quando algum `expect` falha, algum `test`/`describe` lança, ou um `*.pbt.ts` falha após shrinking.
- Códigos não-zero arbitrários quando o runner falha em carregar (config inválida, módulo não encontrado, etc.).

Citação: documentação oficial do Vitest sobre exit codes — comportamento idêntico ao default do `vitest run`/`vitest --run`. Esta fase não verifica empiricamente um failure-on-purpose (não há `it.skip` ou caso quebrado proposital introduzido); o contrato é declarativo.

#### Comportamento esperado com `process.env.CI === "true"`

Vitest aplica defaults diferentes quando detecta ambiente de CI (via `process.env.CI`):

- **`--allowOnly: false`** por default. Qualquer `it.only(...)` ou `describe.only(...)` deixado no código faz o runner sair com `code 1` em CI, mesmo que os testes filtrados passariam.
- **`--passWithNoTests: false`** por default. Suite vazia fica falha (relevante quando alguém remove acidentalmente todos os arquivos casados pelo `test.include`).
- **`--bail`**: não muda em CI (fica off por default).

Esta fase **declara a expectativa**; não verifica empiricamente. A verificação efetiva entra em `fase-7-dx-infra` quando a pipeline rodar com `CI=true` e quando houver gates explícitos para `.only`/`.skip` sem comentário justificativo.

### 8.2 Scripts pré-existentes inalterados

> Tarefa 6.2. Verificação por inspeção de `package.json > scripts` (sem rodar — alguns demandam Playwright browsers, Postgres ou Studio).

Conferido em `c:\Users\edulanzarin\Documents\Dev\privello\package.json`:

| Script | Comando | Status |
|---|---|---|
| `dev` | `next dev --hostname 0.0.0.0` | ✅ inalterado |
| `build` | `prisma generate && next build` | ✅ inalterado |
| `start` | `next start` | ✅ inalterado |
| `lint` | `eslint` | ✅ inalterado |
| `test:e2e` | `playwright test` | ✅ inalterado |
| `test:e2e:ios` | `playwright test --project=ios-safari` | ✅ inalterado |
| `test:e2e:desktop` | `playwright test --project=desktop-chrome` | ✅ inalterado |
| `db:generate` | `prisma generate` | ✅ inalterado |
| `db:push` | `prisma db push` | ✅ inalterado |
| `db:migrate` | `prisma migrate dev` | ✅ inalterado |
| `db:seed` | `prisma db seed` | ✅ inalterado |
| `db:studio` | `prisma studio` | ✅ inalterado |
| `postinstall` | `prisma generate` | ✅ inalterado |

Total: 13 scripts pré-existentes confirmados (12 listados como meta na Tarefa 6.2 + `start`, presente nas duas listagens). Nenhum argumento alterado, nenhuma renomeação. Os 3 scripts adicionados pela Tarefa 1.4 (`test`, `test:watch`, `test:run`) coexistem com os 13 acima sem colisão.

**Validação operacional**: nenhum dos scripts pré-existentes foi efetivamente executado nesta tarefa — `dev`/`build` exigem Next 16 + Prisma client gerado, `test:e2e*` exigem Playwright browsers + servidor up, e os `db:*` exigem Postgres acessível. A entrega desta fase não toca código de aplicação (ver `requirements.md > Non-Goals`), portanto a inalteração dos scripts é garantida por não-modificação do `package.json` além das adições de seção `test*`.

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

---

## 5. Pares parse/serialize identificados

Lista confirmada pela Tarefa 4.1 lendo cada módulo classificado como `pure` ou `parcial` na §4. Cada entrada cita as funções com `path:linha` e mapeia à Property correspondente em `design.md > Correctness Properties`. Pares previstos no `design.md` que NÃO existem no código real ficam marcados como **não declarável** com justificativa.

### 5.1 `src/lib/money.ts` — Property 1 (round-trip BRL ↔ centavos)

**Status: não declarável.**

`design.md > Property 1` previa o par `brlToCents ↔ centsToBRL`. Na leitura do módulo (`src/lib/money.ts:1-7`), o único export é `formatBrl(value: number): string` — uma formatação one-way (number em reais inteiros → string `Intl.NumberFormat("pt-BR", { currency: "BRL", maximumFractionDigits: 0 })`). NÃO existe função inversa que parseia a string formatada de volta para número, e NÃO existe representação em centavos no módulo.

**Consequência:** Property 1 do `design.md > Correctness Properties` é **não declarável** com a API atual. A Tarefa 4.2, que prevê `src/lib/money.pbt.ts`, vai precisar ser revista (sem par, sem `.pbt.ts` artificial). A introdução de `brlToCents`/`centsToBRL` é um `OutOfScopeFinding` candidato para `fase-3-backend` (camada financeira) — registrar em `requirements.md > §3` quando a Tarefa 4.2 chegar.

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

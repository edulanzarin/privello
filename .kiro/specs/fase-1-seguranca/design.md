# Design Document — `fase-1-seguranca`

> Spec-filho promovido a partir do master `auditoria-geral`. Este documento detalha como **endurecer a superfície de segurança** que hoje vive em `next.config.ts`, `src/lib/auth.ts`, `src/app/api/dev/**`, `src/app/api/cron/**`, `src/app/api/upload/route.ts` e nas Server Actions/Route Handlers que recebem input externo. A execução das tarefas deste design vive em `tasks.md` (a ser produzido depois).

## Overview

A Fase 1 fecha lacunas conhecidas e mensuráveis. A síntese vinda do master:

- **`/api/dev/*`** (`reset`, `activate-plans`): hoje gateado apenas por `NODE_ENV !== "production"`. Sem auth, sem token, sem confirmação. Em produção devolve 403, mas não esconde a existência do endpoint.
- **`/api/cron/*`** (`expire-plans`, `reset-hot`): aceita `?secret=` em query string. Loga em servidor/proxy/CDN.
- **`next.config.ts > images.remotePatterns`**: contém `{ protocol: "https", hostname: "**" }` no fim do array. Otimizador aceita qualquer host HTTPS.
- **`next.config.ts > headers()`**: aplica X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control. **Sem CSP, sem HSTS.**
- **`/api/upload/route.ts`**: valida Content-Length, MIME e tamanho por categoria. Não tem rate limit; não usa Zod.
- **NextAuth (`src/lib/auth.ts`)**: `trustHost: true` aberto. Sem documentação para `AUTH_URL` em produção.
- **Server Actions e API Routes em geral**: `zod` não aparece em `package.json > dependencies`. Validação manual (ou ausente) hoje.
- **Rate limiting**: zero em login, upload, `/api/wa-click`, comentários, visualização de stories.

A fase entrega:

1. Auth de admin/token nos Dev_Endpoints com 404 em produção quando não autenticado.
2. Cron com segredo via header (com transição compatível com query string).
3. Whitelist explícita em `images.remotePatterns` (sem curinga).
4. Schemas Zod cobrindo todos os Public_Input_Endpoints.
5. Módulo de rate limit aplicado a 5 endpoints com tabela declarada de limite/janela.
6. `AUTH_URL` documentado para produção e `trustHost` condicional.
7. CSP em modo `Report-Only` primeiro, transição para enforcement só após janela de validação; HSTS direto sem `preload`.
8. Documento canônico de endpoints alvo de Zod e tabela de rate limits no diretório do spec-filho.

A fase **não** entrega: rotação de chaves, SCA, WAF, troca de stack de auth, testes (consumidos da Fase 2).

### AGENTS_Rule — consultas registradas

A regra dura E5 do master exige consulta a `node_modules/next/dist/docs/` antes de decisões em `images-config` e `headers`. A consulta foi feita durante a redação deste design e está registrada na seção 4 do `requirements.md` deste spec-filho. Os achados materiais são:

- **`images-config`**: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md` cobre **apenas loaders/CDN** (Cloudinary, Akamai, Cloudfront etc.). **Não documenta `remotePatterns` nessa página.** O schema canônico do `RemotePattern` está em `node_modules/next/dist/shared/lib/image-config.d.ts` e expõe os campos `{ protocol?: "http" | "https", hostname: string, port?: string, pathname?: string, search?: string }`. Wildcards: `*` casa um único segmento de subdomínio/path; `**` casa qualquer número.
- **`headers`**: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md` documenta `async headers()` e dá exemplos canônicos para HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`), X-Frame-Options, Permissions-Policy, X-Content-Type-Options, Referrer-Policy, X-DNS-Prefetch-Control. Sobre CSP, redireciona para `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.
- **CSP no Next 16**: o guia explica que CSP via **nonce** exige `proxy.ts` (Next 16 renomeou `middleware.ts` → `proxy.ts`) e **força dynamic rendering em todas as páginas que ele cobrir**. Isso desabilita static optimization e ISR, é incompatível com PPR, e tem impacto direto no LCP/custo de hosting. CSP via **header estático** em `next.config.ts > headers()` mantém static optimization mas exige `'unsafe-inline'` para scripts/estilos do framework. SRI experimental existe como meio termo (App Router only).

Esses três achados moldam decisões deste design (especialmente CSP).

## Architecture

```
+-- next.config.ts                         [refactor]
|     images.remotePatterns                 - remover curinga, whitelist explícita
|     async headers()                       - adicionar CSP-Report-Only e HSTS
|
+-- src/lib/
|   +-- auth.ts                             [refactor]
|   |     trustHost                         - condicional em produção
|   +-- rate-limit.ts                       [novo]
|   |     interface RateLimiter              - store plugável (memória default)
|   |     função rateLimit(key, scope, ...) - retorna { allowed, retryAfter }
|   +-- security/
|       +-- dev-auth.ts                     [novo]
|       |     função requireAdminOrToken()  - usado em Dev_Endpoints
|       +-- cron-auth.ts                    [novo]
|             função verifyCronSecret()     - aceita header e (durante transição) query
|
+-- src/lib/validation/                     [novo]
|     <endpoint>.schema.ts                   - schemas Zod por endpoint
|     index.ts                              - re-exports nomeados
|
+-- src/app/api/
|   +-- dev/
|   |   +-- reset/route.ts                  [refactor: requireAdminOrToken]
|   |   +-- activate-plans/route.ts         [refactor: requireAdminOrToken]
|   +-- cron/
|   |   +-- expire-plans/route.ts           [refactor: verifyCronSecret + warning na query]
|   |   +-- reset-hot/route.ts              [refactor: idem]
|   +-- upload/route.ts                     [refactor: rate limit + Zod no payload]
|   +-- wa-click/route.ts                   [refactor: rate limit silencioso]
|   +-- (demais Route Handlers que aceitam input)  [refactor: Zod]
|
+-- .env.example                             [novo]
|     AUTH_URL, DEV_ENDPOINT_TOKEN, CRON_SECRET, ...
|
+-- AGENTS.md ou .kiro/specs/fase-1-seguranca/nextauth-prod.md
|     passo a passo de configuração de produção do NextAuth
|
+-- .kiro/specs/fase-1-seguranca/
      +-- endpoints-zod.md                  [novo]
      +-- rate-limits.md                    [novo]
```

### Fluxos

**Dev_Endpoint hardening (Requirement 1):**

```
Request -> /api/dev/<rota>
  ↓
requireAdminOrToken(req):
  - se DEV_ENDPOINT_TOKEN definido E header Authorization: Bearer <DEV_ENDPOINT_TOKEN> coincidir → ok (token mode)
  - senão, await auth() → se sessão.role ∈ {ADMIN, MODERATOR} → ok (session mode)
  - senão:
      - se NODE_ENV === "production" → response 404 (esconde existência)
      - senão (dev) → response 401 com mensagem de orientação
log estruturado: { ts, ip, mode, userIdOrTokenPrefix }
```

**Cron_Endpoint transition (Requirement 2):**

```
Request -> /api/cron/<rota>
  ↓
verifyCronSecret(req):
  - lê Authorization (Bearer) → se válido → ok
  - lê X-Cron-Secret → se válido → ok
  - lê ?secret= (modo transição) → se válido → ok + warn { rota, ip, mensagem: "migre para header" }
  - se janela de transição encerrada (data declarada no commit que entrega a EAR) E ?secret= é a única forma → 401
  - se nada bate → 401 (corpo vazio)
```

**Image whitelist (Requirement 3):**

```
next.config.ts > images.remotePatterns = [
  { protocol: "https", hostname: "<dominio-proprio-prod>", pathname: "/uploads/**" },
  { protocol: "https", hostname: "picsum.photos", pathname: "/**" },          // dev/seed
  { protocol: "https", hostname: "commondatastorage.googleapis.com" },         // seed
  { protocol: "https", hostname: "*.googleusercontent.com" },                  // ?
  // remoção do { hostname: "**" }
]
```

A whitelist final precisa ser declarada com base em hosts efetivamente usados pelo código de produção. O comentário no `next.config.ts` cita o caminho consultado em `node_modules/next/dist/docs/...` e a data.

**Zod nos Public_Input_Endpoints (Requirement 4):**

```
Endpoint:
  parse com schema (Zod) → se OK → segue handler
                          → se falha → 400 com { issues } no body (Route Handler)
                                       OU { error, issues } tipado (Server Action)
```

Cada endpoint alvo aparece em `endpoints-zod.md` com (path, função, schema, formato do erro).

**Rate limit (Requirement 5):**

```
Endpoint sensível:
  rateLimit({ scope, key, windowSec, limit }) → { allowed, retryAfter? }
    - allowed=false:
        - login/upload/comentários → 429 + Retry-After
        - wa-click → 200 silencioso (sem inserir click)
        - stories → 200 idempotente
log de auditoria em login/upload/comentários quando allowed=false
```

**NextAuth produção (Requirement 6):**

```ts
// src/lib/auth.ts (esboço)
const isProd = process.env.NODE_ENV === "production";

NextAuth({
  ...
  trustHost: isProd ? trustHostFromAuthUrl : true,
  ...
});

// helper: aceita request apenas se origin === process.env.AUTH_URL
```

`AUTH_URL` é documentado em `.env.example` e em `nextauth-prod.md` (ou `AGENTS.md`).

**CSP + HSTS (Requirement 7):**

Decisão: **CSP em `Content-Security-Policy-Report-Only` via `next.config.ts > headers()` (sem nonce)** durante a janela de validação (mín. 7 dias em produção); transição para `Content-Security-Policy` só após relatório zerado. **HSTS direto, sem `preload`**, max-age 180 dias. Justificativa baseada na consulta AGENTS_Rule:

- CSP com nonce exige `proxy.ts` + dynamic rendering em todas as rotas cobertas. **Conflita com Fase 3** (que vai classificar 43 rotas como `static`/`revalidate`/Cache Components). Adotar nonce nesta fase invalida o trabalho da Fase 3 antes dele acontecer.
- CSP estático (sem nonce) requer `'unsafe-inline'` para scripts e estilos do framework — isso é uma concessão consciente, registrada como decisão.
- A janela em `Report-Only` permite descobrir violações reais sem quebrar o site.
- HSTS sem `preload` é reversível; com `preload` cria dependência longa em browser stores. `preload` fica para spec próprio futuro.
- Os quatro headers já aplicados em `next.config.ts` (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) e o adicional X-DNS-Prefetch-Control permanecem inalterados.

### Boundaries

- **Auth do app vs auth do Dev_Endpoint**: Dev_Endpoints aceitam ou sessão NextAuth com role admin OU token bearer dedicado (`DEV_ENDPOINT_TOKEN`). Token nunca viaja via query string nem aparece em log; comparações em tempo constante (`crypto.timingSafeEqual`).
- **Cron secret vs Dev token**: chaves diferentes, escopos diferentes. Cron lida com idempotência de rotinas; Dev lida com mutações destrutivas.
- **Rate limit store**: por padrão, em memória do processo (MVP). Interface plugável para Redis/Upstash em fase futura. Em produção single-instance hoje, isso é aceitável; multi-instance demanda store compartilhado e fica registrado como `OutOfScopeFinding` para Fase 7.
- **CSP em camadas**: o `next.config.ts > headers()` do app trata CSP global. O header CSP específico do `next/image` (configurado via `images.contentSecurityPolicy` em `next.config.ts`) fica intacto até a fase futura que trate CDN de imagens.

## Components and Interfaces

### 1. `src/lib/security/dev-auth.ts`

```ts
type DevAuthContext = { mode: "session" | "token"; subject: string };

export async function requireAdminOrToken(
  req: Request
): Promise<{ ok: true; ctx: DevAuthContext } | { ok: false; status: 401 | 404 }> {
  // 1. token: header Authorization: Bearer <DEV_ENDPOINT_TOKEN>
  // 2. session: NextAuth + role ∈ {ADMIN, MODERATOR}
  // 3. miss em produção → 404; miss em dev → 401
}
```

Consumido por `src/app/api/dev/*/route.ts`. Substitui o atual `if (NODE_ENV === "production") return 403`.

### 2. `src/lib/security/cron-auth.ts`

```ts
type CronAuthSource = "header-authorization" | "header-x-cron-secret" | "query-secret-deprecated";

export function verifyCronSecret(
  req: Request,
  opts: { transitionEndsAt: Date }
): { ok: true; source: CronAuthSource; warning?: string } | { ok: false };
```

Consumido por `src/app/api/cron/*/route.ts`. A constante `transitionEndsAt` é declarada no commit que entrega o EAR 2.4 (data ≥ 14 dias após merge para garantir janela operacional).

### 3. `src/lib/rate-limit.ts`

```ts
export type RateLimitScope = "ip" | "user" | "ip+profile" | "user+story";

export interface RateLimiterStore {
  incr(key: string, windowSec: number): Promise<number>;
  // implementação default: Map em memória + cleanup periódico
}

export interface RateLimitConfig {
  scope: RateLimitScope;
  key: string;          // já resolvido pelo chamador (ex.: ip ou userId)
  windowSec: number;    // janela em segundos
  limit: number;        // requests/janela
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;  // segundos até reset
  remaining: number;
}

export async function rateLimit(
  config: RateLimitConfig,
  store?: RateLimiterStore
): Promise<RateLimitResult>;
```

Consumido por NextAuth login (via callback ou route adicional), `/api/upload`, `/api/wa-click`, endpoints de comentários, endpoints de stories.

### 4. `src/lib/validation/`

Cada arquivo `<endpoint>.schema.ts` exporta:

```ts
import { z } from "zod";

export const UploadBodySchema = z.object({
  isPublic: z.coerce.boolean().optional(),
  caption: z.string().trim().max(500).optional(),
  mediaType: z.enum(["IMAGE", "REEL"]).default("IMAGE"),
  purpose: z.enum(["", "story"]).optional(),
});

export type UploadBody = z.infer<typeof UploadBodySchema>;
```

Consumidores importam `UploadBodySchema` no Route Handler e fazem `const result = UploadBodySchema.safeParse(rawBody)`. Em falha, devolvem 400 com `result.error.flatten()` formatado.

`endpoints-zod.md` no spec-filho lista cada endpoint com:

| Path | Handler | Schema | Resposta de erro |

### 5. `next.config.ts` — patches

```ts
const PROD_HOST = process.env.PRODUCTION_HOSTNAME ?? ""; // ex.: privello.com.br

const remotePatterns: RemotePattern[] = [
  ...(PROD_HOST
    ? [{ protocol: "https" as const, hostname: PROD_HOST, pathname: "/uploads/**" }]
    : []),
  { protocol: "https", hostname: "picsum.photos", pathname: "/**" },           // dev/seed
  { protocol: "https", hostname: "commondatastorage.googleapis.com" },          // dev/seed
  { protocol: "https", hostname: "storage.googleapis.com" },
  { protocol: "https", hostname: "*.googleusercontent.com" },
];

// Comentário obrigatório no arquivo:
// AGENTS_Rule images-config: consulta em
// `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md`
// e schema em `node_modules/next/dist/shared/lib/image-config.d.ts:type RemotePattern`.
// Data: 2026-03-14.
```

```ts
const securityHeaders = [
  // ... existentes intactos ...
  // CSP em Report-Only inicialmente (janela de validação)
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspStaticValue,    // gerado de acordo com origens reais
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=15552000; includeSubDomains",  // 180 dias, sem preload
  },
];
```

`cspStaticValue` é uma string longa, gerada a partir de origens reais do app (uploads próprios, MercadoPago, fonts se houver). Validação inicial em homologação; só vira `Content-Security-Policy` (sem `-Report-Only`) quando o relatório zerar. **Aceita-se `'unsafe-inline'` em script-src e style-src** porque estamos optando por CSP estático (sem nonce) para preservar static rendering — decisão registrada na seção 4 do `requirements.md` deste spec-filho.

## Data Models

### `RateLimitTable` (constantes)

```ts
// src/lib/rate-limit-config.ts
export const RATE_LIMIT_TABLE = {
  login:        { scope: "ip",          windowSec: 15 * 60, limit: 5  },
  upload:       { scope: "user",        windowSec: 60 * 60, limit: 20 },
  waClick:      { scope: "ip+profile",  windowSec: 60 * 60, limit: 10 },
  comment:      { scope: "user",        windowSec: 60,      limit: 5  },
  storyView:    { scope: "user+story",  windowSec: 60 * 60, limit: 1  },
} as const;
```

A tabela é a fonte de verdade. `rate-limits.md` no spec-filho replica essa estrutura em prosa para revisão humana.

### `EndpointZodList`

Lista canônica em `endpoints-zod.md`. Schema da própria tabela:

| Path | Handler | Schema | Resposta de erro |
|------|---------|--------|------------------|
| `/api/upload` | `POST route.ts` | `UploadBodySchema` (formData) | 400 com `{ issues: [...] }` |
| `/api/review` | `POST route.ts` | `ReviewBodySchema` | 400 |
| `/api/wa-click` | `POST route.ts` | `WaClickBodySchema` | 400 |
| `/api/cadastro` | `POST route.ts` | `SignupBodySchema` | 400 |
| `app/_actions/<...>.ts` | server actions | `<Action>Schema` | objeto tipado `{ error, issues }` |
| ... (preencher na execução) | ... | ... | ... |

A tabela completa é entregue em `endpoints-zod.md`; aqui registramos só o template.

## Error Handling

- **Token Dev_Endpoint vazado**: rotação fica fora desta fase (Non-Goal). Mitigação imediata: registrar como `OutOfScopeFinding` para `fase-7-dx-infra` (rotação) e revogar manualmente em `.env`.
- **Cron secret expira mid-window**: `verifyCronSecret` aceita `transitionEndsAt` por endpoint; o helper retorna 401 sem corpo se a janela passou e `?secret=` é a única forma. Schedulers externos (Vercel cron, GitHub Actions) precisam ser atualizados ANTES da janela fechar — checklist no commit que muda `transitionEndsAt`.
- **CSP `Report-Only` produzindo violações inesperadas em prod**: o comportamento é zero downtime — `Report-Only` não bloqueia, só reporta. Janela de validação dá tempo de ajustar `script-src`/`style-src` antes de virar enforcement.
- **Rate limit em multi-instance**: store em memória vira limite por processo. Em ambiente single-instance (estado atual conhecido) é aceitável. Migração para store compartilhado é `OutOfScopeFinding` para `fase-7-dx-infra` ou spec próprio.
- **Zod schema cobre 90% mas o último 10% tem campos legacy**: registrar o vácuo como item `Reescopado` no spec-filho e abrir update no master se cobertura final ficar abaixo do contrato (todos os Public_Input_Endpoints).
- **AGENTS_Rule alterada (Next 16.x → próxima minor)**: linha adicional na seção 4 do `requirements.md` registrando a nova consulta. Não se sobrescreve linha existente.

## Testing Strategy

A Fase 1 não entrega testes determinísticos como produto principal; consome a infraestrutura da Fase 2 quando ela ficar `Done`. O contrato é:

- **Para módulos puros nascidos nesta fase** (`src/lib/security/dev-auth.ts`, `cron-auth.ts`, `rate-limit.ts`, `validation/*.schema.ts`): após a Fase 2 estar `Done`, a Fase 1 entrega `*.test.ts` co-localizado para cobrir as decisões críticas (passa/recusa, janelas, formato de erro). Cobertura desses módulos não é gate desta fase, é sequela natural do trabalho.
- **Para os módulos com propriedades enunciáveis** (`rate-limit.ts`, `cron-auth.ts`, `dev-auth.ts`): a Fase 1 entrega também os `*.pbt.ts` correspondentes às Properties enunciadas em "Correctness Properties" abaixo, igualmente após a Fase 2 estar `Done`.
- **Para Route Handlers e Server Actions**: testes ficam para a fase que definir cobertura de rotas (futura, não Fase 2 nem Fase 1).
- **Verificação manual nesta fase**: cada EAR tem um cenário de aceite documentado em `tasks.md` — request de teste com `curl` ou ferramenta similar, evidência anexada como log ou screenshot.

Itens que **nunca** rodam nesta fase:

- Testes de carga / penetração — fora desta fase. Spec próprio futuro.
- Testes E2E novos no Playwright — Non-Goal.
- Verificação de canal lateral (timing) sobre `crypto.timingSafeEqual` — exige instrumentação fora do escopo de Vitest/fast-check.

## Correctness Properties

Os módulos puros desta fase têm propriedades universais bem definidas. As Properties abaixo viram `*.pbt.ts` co-localizados quando a Fase 2 estiver `Done` — não bloqueiam a entrega da Fase 1 (verificação manual cobre os EARS), mas são o caminho natural de regressão.

### Property 1: Rate limit conta corretamente dentro da janela

**Validates: Requirements 5.1, 5.2**

Para toda chave `k` e configuração `c = { windowSec, limit }`, a sequência de `c.limit` chamadas consecutivas a `rateLimit({ ...c, key: k })` dentro da janela retorna `{ allowed: true }` e a `(c.limit + 1)`-ésima retorna `{ allowed: false, retryAfter > 0 }`.

A propriedade enuncia a invariante mínima do contador. Geradores: `fc.string()` para `key`, `fc.integer({ min: 1, max: 60 })` para `windowSec`, `fc.integer({ min: 1, max: 100 })` para `limit`. Tempo é mockado via `vi.useFakeTimers()`.

### Property 2: Rate limit é independente entre chaves

**Validates: Requirements 5.1**

Para todo par de chaves `k1 ≠ k2`, exaurir o limite de `k1` não afeta `rateLimit` de `k2`. Equivalentemente: `rateLimit` aplicado a `k2` retorna `{ allowed: true }` mesmo após `c.limit` chamadas em `k1` na mesma janela.

A propriedade cobre regressão clássica de implementação que confunde escopo (ex.: usar IP como chave global e bater limite por todos os usuários atrás do mesmo NAT). O design define `RATE_LIMIT_TABLE` com `scope` para evitar isso; a Property garante.

### Property 3: Rate limit reseta após `windowSec`

**Validates: Requirements 5.1**

Para toda chave `k` exaurida (estado em que `rateLimit` retorna `{ allowed: false }`), avançar o tempo em mais de `windowSec` segundos faz a próxima chamada retornar `{ allowed: true, remaining: limit - 1 }`.

Cobre regressão silenciosa: contador que nunca decai. `vi.advanceTimersByTime((windowSec + 1) * 1000)` reproduz a passagem de tempo determinística.

### Property 4: Schemas Zod desta fase são idempotentes em parse

**Validates: Requirements 4.1, 4.5**

Para todo schema `S ∈ { UploadBodySchema, WaClickBodySchema, ReviewBodySchema, SignupBodySchema, ... }` listado em `endpoints-zod.md` e todo input válido `v` (gerador derivado de `S` via `fc.record(...)`), `S.parse(S.parse(v))` é estruturalmente igual a `S.parse(v)`.

A propriedade cobre o erro comum de `transform` que muda formato a cada chamada (ex.: `.trim()` aplicado duas vezes muda nada, mas `.transform(x => x + 1)` quebra a invariante). Schemas desta fase **não devem** ter `transform` que viole idempotência; a Property é o gate.

### Property 5: Cron auth aceita exatamente os três caminhos durante a janela de transição

**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

Para todo `transitionEndsAt > now` e segredo correto `s` configurado:

- `verifyCronSecret(req com Authorization: Bearer s)` → `{ ok: true, source: "header-authorization" }`
- `verifyCronSecret(req com X-Cron-Secret: s)` → `{ ok: true, source: "header-x-cron-secret" }`
- `verifyCronSecret(req com ?secret=s)` → `{ ok: true, source: "query-secret-deprecated", warning: defined }`

E para todo segredo errado `s'`, qualquer um dos três caminhos retorna `{ ok: false }`.

A propriedade cobre regressão crítica: aceitar segredo via canal não previsto (ex.: ambos os headers presentes mas só um válido) ou rejeitar caminho legítimo durante a janela.

### Property 6: Cron auth rejeita query string após `transitionEndsAt`

**Validates: Requirements 2.4**

Para todo `now > transitionEndsAt`, `verifyCronSecret(req com ?secret=s, { transitionEndsAt })` retorna `{ ok: false }` mesmo quando `s` é o segredo correto, **a menos que** o request também traga `Authorization` ou `X-Cron-Secret` válidos.

A propriedade garante que a transição realmente termina (não fica "sempre aceitando query" por acidente).

### Property 7: Dev auth produz 404 em produção sem credencial

**Validates: Requirements 1.2, 1.3**

Para todo request sem header `Authorization: Bearer <DEV_ENDPOINT_TOKEN>` válido e sem sessão de admin/moderator, com `process.env.NODE_ENV === "production"`, `requireAdminOrToken(req)` retorna `{ ok: false, status: 404 }`.

A propriedade cobre o requisito de "esconder existência do endpoint" em produção. Em dev, status passa a ser 401 — Property simétrica:

### Property 8: Dev auth produz 401 em dev sem credencial

**Validates: Requirements 1.4**

Para todo request sem credencial válida, com `process.env.NODE_ENV !== "production"`, `requireAdminOrToken(req)` retorna `{ ok: false, status: 401 }` com mensagem de orientação não-vazia.

> Estas 8 Properties não são gate da Fase 1 — a entrega passa por verificação manual dos EARS. Elas viram `*.pbt.ts` quando a Fase 2 estiver disponível, com tarefas registradas no commit que entrega cada módulo.

## Saída deste design

Este `design.md` é considerado pronto quando:

- Cobre as 8 EARS de `requirements.md` desta fase com decisões verificáveis.
- Lista os arquivos a criar (`src/lib/security/{dev-auth,cron-auth}.ts`, `src/lib/rate-limit.ts`, `src/lib/rate-limit-config.ts`, `src/lib/validation/<...>.schema.ts`, `.env.example`, `endpoints-zod.md`, `rate-limits.md`, `nextauth-prod.md`).
- Registra a decisão de CSP estático em `Report-Only` com janela de validação e a justificativa contra CSP com nonce (incompatível com static rendering planejado pela Fase 3).
- Aponta o que vira `OutOfScopeFinding` (rotação de chaves, store compartilhado de rate limit, CSP com nonce, `preload` HSTS).

A próxima etapa do workflow é o `tasks.md` deste mesmo spec-filho, que decompõe este design em sub-tarefas executáveis com dependências.



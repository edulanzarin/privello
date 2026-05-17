# Changelog

Todas as mudanças notáveis a este projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> **Manutenção**: cada PR que introduz mudança relevante atualiza este `CHANGELOG.md`
> no mesmo commit. Não há tarefa separada de "atualizar changelog" nem automação
> (release-please / semantic-release / changesets ficam como Non-Goal — cf.
> `.kiro/specs/fase-7-dx-infra/requirements.md > Requirement 7.7`).

## [Unreleased]

### Added

- **Tokens de cor "soft"** em `src/app/globals.css`: `--privello-success-soft`,
  `--privello-warning-soft`, `--privello-danger-soft`, `--privello-info-soft`,
  `--privello-purple-soft` — backgrounds calmos para banners, badges e cards de
  estado (redesign-macos-system).
- **Tokens de chart e elevação** em `src/app/globals.css`: `--privello-chart-grid`
  (cor canônica para grids de Recharts) e escala `--shadow-hairline`,
  `--shadow-sm`, `--shadow-md` para sombras consistentes
  (redesign-macos-system).
- **Primitivo `Tabs`** (`src/components/ui/tabs.tsx`): variantes `pills` e
  `underline`, ARIA `tablist`/`tab`/`tabpanel` com `aria-selected` e roving
  tabindex, suporte a `href` (renderiza `<Link>` com `aria-current="page"`) ou
  `onChange` (redesign-macos-system).
- **Primitivo `Table`** (`src/components/ui/table.tsx`): exporta `Table`,
  `THead`, `TR`, `TH`, `TD`; wrapper com overflow horizontal, hairlines via
  `border-line`, `<th scope="col">` por padrão e prop `numeric` em `TD` que
  aplica `tabular-nums text-right` (redesign-macos-system).
- **Primitivo `KPICard`** (`src/components/ui/kpi-card.tsx`): label, valor com
  `tabular-nums`, ícone opcional, `subtitle`, `delta` direcional e estado
  `alert` (aplica `border-warning/40 bg-warning-soft`); aceita `href` para
  envelopar em `<Link>` com `aria-label` (redesign-macos-system).
- **Primitivo `DarkSidebarShell`** (`src/components/layout/dark-sidebar-shell.tsx`):
  chrome compartilhado de sidebar escura para `/admin/*` e `/painel/*` —
  `<aside>` desktop fixo `w-56`, header `h-14` mobile com drawer e overlay,
  `aria-current="page"` no item ativo (redesign-macos-system).
- **Variantes em `Badge`** (`src/components/ui/badge.tsx`): `info`, `danger`,
  `premium` consumindo os novos tokens soft, mantendo backwards-compatibility
  das variantes existentes (redesign-macos-system).
- **Variantes em `Card`** (`src/components/ui/card.tsx`): `success-subtle`,
  `warning-subtle`, `danger-subtle` para banners de estado calmos
  (redesign-macos-system).
- **Util `statusToBadgeVariant`** (`src/lib/ui/status.ts`): mapa canônico
  `Status → BadgeVariant` (NOVO/OPEN→info, REVISAO/IN_PROGRESS→warning,
  APROVADO→success, REJEITADO/CLOSED→muted, BANIDO/SUSPENSO→danger,
  PREMIUM→premium, DESTAQUE→coral, ESSENCIAL→info) com fallback determinístico
  `"muted"` (redesign-macos-system).
- **Tokens de chart** (`src/lib/chart-tokens.ts`): `CHART_PALETTE`,
  `CHART_GRID_STROKE`, `CHART_TICK_FILL`, `CHART_AREA_OPACITY`,
  `CHART_TOOLTIP_STYLE` apontando para `var(--privello-*)` — fonte única para
  cores em `admin-charts.tsx` (redesign-macos-system).
- **Lint guard contra paleta crua** (`scripts/check-no-raw-palette.mjs`): roda
  em strict mode no CI, bane classes Tailwind de paleta crua
  (`zinc/amber/sky/emerald/fuchsia/indigo/rose/pink/purple/teal/lime/stone/slate/gray/neutral`)
  fora de `src/components/ui/**` e `src/lib/chart-tokens.ts`; também detecta
  `outline: none` sem `focus-visible:ring` substituto
  (redesign-macos-system).
- **Documentação `docs/design-system.md`**: referência canônica do design
  language — princípios, tabela de tokens, guia por componente com do/don't,
  charts, anti-patterns e notas de a11y (redesign-macos-system).
- **Seed de produção** (`prisma/seed.production.ts`) — script idempotente
  que popula apenas o catálogo essencial: 27 capitais brasileiras, 1 admin,
  e `HotPeriodConfig`. Nenhum profile/media/review fake é criado (esses
  pertencem ao seed de dev). Comando: `npm run db:seed:prod`. Senha do admin
  documentada apenas no gerenciador de senhas do operador (nunca no repo)
  (migracao-infra-producao, post-deploy).
- **`Storage_Module`** (`src/lib/storage.ts`): abstração de upload com `putObject`,
  `deleteObject`, `joinPublicUrl` e `isLocalFallbackMode`; backend Cloudflare R2 (S3
  API via `@aws-sdk/client-s3`) em produção e `Storage_Local_Fallback` (escrita em
  `public/<key>`) em dev/test (migracao-infra-producao).
- **Containerização**: `Dockerfile` multi-stage (`deps` → `builder` → `runner`,
  Alpine, usuário não-root `nextjs:1001`, `prisma migrate deploy` no `CMD`) e
  `.dockerignore` na raiz (migracao-infra-producao).
- **`Dockerfile`**: `ARG AUTH_URL` + `ENV AUTH_URL` no estágio `builder` (default
  `http://localhost:3000`) — `next build` evalua `src/lib/auth.ts` em `NODE_ENV=production`,
  que exige `AUTH_URL` por guard de boot do NextAuth v5; em produção o operador
  passa o valor real via Railway env service ou `--build-arg` (migracao-infra-producao,
  Task 8).
- **`next.config.ts`**: `output: "standalone"` para imagem Docker enxuta — note que
  `.next/standalone` não inclui `public/` nem `.next/static/` (caveat documentado em
  `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md`)
  (migracao-infra-producao).
- **Documentação operacional**: `docs/deploy-railway.md` (deploy canônico em
  Railway + Cloudflare R2 + Cloudflare DNS, com `Rollback_Plan`, smoke checks e
  blockers pré-go-live) (migracao-infra-producao).
- **`.env.example`** e **`docs/env.md`**: 5 novas envvars `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`,
  opcionais em dev (Storage_Local_Fallback) e obrigatórias em prod
  (migracao-infra-producao).
- **CI**: pipeline GitHub Actions com 3 estágios — lint, typecheck, test — em
  `.github/workflows/ci.yml` (fase-7).
- **Documentação operacional**: `docs/env.md` (variáveis de ambiente), `docs/docker.md`
  (Postgres de dev), `docs/adr/` (Architecture Decision Records, modelo + ADRs 0002–0005),
  `CHANGELOG.md` (este arquivo) (fase-7).
- **`engines.node`**: declarado `">=20.0.0"` em `package.json` para alinhar dev local e
  CI (fase-7, ver ADR 0004).
- **`.env.example`**: passa a documentar `PRISMA_DEBUG_QUERIES` e `MP_WEBHOOK_SECRET`
  (fase-7, ver `docs/env.md`).
- **Type-safety baseline**: contagem de `any` em `src/` registrada em
  `.kiro/specs/fase-7-dx-infra/dx-conventions.md > §6` (fase-7).
- **Camada de services**: 9 services em `src/lib/services/` consolidados —
  `subscription`, `profile`, `city`, `media`, `discover`, `story`, `reels`, `payments`,
  `support` (fase-3).
- **Testes**: Vitest 4.1.6 + fast-check 4.8.0 + `@fast-check/vitest` 0.4.1 instalados;
  293 testes verdes incluindo PBTs (fase-2 + fase-3 + fase-4 + fase-5).
- **Tokens semânticos**: `--privello-warning`, `--privello-danger`, `--privello-blue`
  em `globals.css`; escala tipográfica explícita `text-2xs` (10px) → `text-8xl` (64px)
  (fase-4).
- **Primitivos UI**: `Dropdown` (compound component) em `src/components/ui/dropdown.tsx`
  e `useFocusTrap` em `src/lib/hooks/use-focus-trap.ts` (fase-4).
- **Primitivos de loading/empty/error**: `EmptyState`, `LoadingSkeleton`, `ErrorState`
  e hook `useOptimisticToggle` (fase-5).
- **View Transitions**: experimental `viewTransition` ativado em `next.config.ts` com
  3 padrões aplicados; regra global `prefers-reduced-motion` respeitada (fase-5).
- **CSP** em Report-Only e **HSTS** (`max-age=15552000; includeSubDomains`) em
  `next.config.ts > headers` (fase-1).
- **Rate limiting** em login, upload, wa-click, comentários e visualização de stories
  (fase-1).
- **Validação Zod** em todas as Server Actions e API Routes que aceitam input do
  usuário (fase-1).
- **Endpoint `/api/dev/*` autenticado** via `DEV_ENDPOINT_TOKEN` ou sessão admin;
  **`/api/cron/*` por header** (`Authorization: Bearer` ou `X-Cron-Secret`), com janela
  de transição até 2026-06-15 (fase-1).
- **Whitelist de hosts** em `next.config.ts > images.remotePatterns` substituindo o
  curinga `**` (fase-1).
- **`.env.example`** versionado com 16 variáveis comentadas (fase-1).
- **Lint anti-regressão** `no-restricted-syntax` em `eslint.config.mjs` cobrindo
  `src/components/**` e `src/app/**` (fase-4).

### Changed

- **Páginas `/admin/*`** migradas para os primitivos canônicos: KPIs ad-hoc → `KPICard`,
  tabelas cruas → `Table`, badges hardcoded → `Badge variant={statusToBadgeVariant(...)}`.
  Atinge `/admin/moderacao`, `/admin/perfis`, `/admin/midias`, `/admin/financeiro`,
  `/admin/suporte` e `/admin/verificacoes/[id]` (redesign-macos-system).
- **`AdminShell`** (`src/components/admin/admin-shell.tsx`): topbar `bg-zinc-950`
  substituída por sidebar lateral via `DarkSidebarShell`, paridade visual com
  `/painel` (redesign-macos-system).
- **`PainelSidebar`** refatorado para consumir `DarkSidebarShell`, sem breaking
  changes em props públicas (redesign-macos-system).
- **`admin-charts.tsx`** (`src/components/admin/admin-charts.tsx`): zero hex
  literais — todas as cores de série, grid e tooltip vêm de `chart-tokens`;
  `ChartCard` interno usa `Card variant="solid" padding="md"` e mostra
  `EmptyState` quando `data.length === 0` (redesign-macos-system).
- **Páginas `/painel/*`** (`/painel/page.tsx`, `/painel/plano/page.tsx`,
  `/painel/perfil/perfil-editor.tsx` e remanescentes): banners de estado migrados
  para `Card variant="success-subtle" | "warning-subtle" | "danger-subtle"` em
  vez de classes cruas (redesign-macos-system).
- **Páginas públicas** (`cadastro/sucesso`, `cadastro/cliente`,
  `cadastro/acompanhante`, `p/[slug]` BOOST badge): substituídas classes Tailwind
  cruas por primitivos e tokens semânticos (redesign-macos-system).
- **5 sites de upload** migrados de `mkdir + writeFile` (filesystem local) para
  `Storage_Module.putObject`: `src/app/api/upload/route.ts`,
  `src/app/api/upload-audio/route.ts`, `src/app/api/upload/verification/route.ts`,
  `registerProviderAction` em `src/app/_actions/auth.ts`, e
  `uploadClientAvatarAction` em `src/app/_actions/client-profile.ts`
  (migracao-infra-producao).
- **`next.config.ts > images.remotePatterns`**: entrada R2 condicional adicionada
  via `extractR2Hostname(process.env.R2_PUBLIC_URL)` (incluída só quando definida);
  demais entradas preservadas (migracao-infra-producao).
- **Alvo de hospedagem**: Vercel → Railway. `docs/deploy-vercel.md` movido para
  `docs/legacy/deploy-vercel.md` (rationale: preservar histórico em `docs/legacy/`
  sem confundir devs novos; `docs/deploy-railway.md` é o documento canônico)
  (migracao-infra-producao).
- **`/api/cities` e `/api/top-cities`**: `export const dynamic = "force-dynamic"`
  para evitar prerender no `next build` (Next 16 tenta prerender rotas sem APIs
  dinâmicas explícitas; ambos os handlers fazem `prisma.city.findMany`, que
  exige `DATABASE_URL` em runtime — não disponível em build de container nem em
  Railway, que só conecta o DB ao service em runtime). `/api/cities` perdeu o
  `revalidate = 3600` (ISR de 1h) — payload pequeno, custo aceitável
  (migracao-infra-producao, Task 8).
- **`src/lib/queries.ts`**: refatorado para estado híbrido com header
  `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`. 27 re-exports de
  `@/lib/services` + helpers JUSTIFICADO (`sortProfileCards`, `finalizeDiscoverOrder`,
  `profileCardInclude`, `ProfileCardPayload`) como oráculo da Property 1 (fase-3,
  ver ADR 0003).
- **`src/lib/auth.ts`**: guard `AUTH_URL` em produção (boot falha se ausente);
  `trustHost` documentado para dev (fase-1).
- **`next.config.ts`**: headers de segurança expandidos (HSTS, CSP Report-Only);
  `images.remotePatterns` com whitelist explícita; `experimental.viewTransition`
  ativado (fase-1 + fase-5).
- **24 consumidores** em `src/app/**` migrados de `@/lib/queries` para `@/lib/services`
  (fase-3).
- **7 rotas** migradas de `force-dynamic` para `revalidate=N` — home, em-alta,
  em-destaque, cidades, buscar, novidades, planos (fase-3).
- **~50 arquivos** em `src/components/**` e `src/app/**` migrados para tokens
  semânticos: 167 → 0 hex literais e 677 → 0 font-size arbitrários (fase-4).
- **~38 rotas** aplicaram `EmptyState`/`LoadingSkeleton`/`ErrorState` (fase-5).
- **5 sites de UI otimista** refatorados via `useOptimisticToggle` (fase-5).

### Deprecated

- **`@/lib/queries` re-exports**: `@deprecated 2026-05-30 — remoção planejada após
  2026-06-13`. Importar de `@/lib/services` em código novo (fase-3, ver ADR 0003).

### Removed

_Nenhum item formalmente removido nas fases 1–7. O cleanup de `src/lib/queries.ts`
(EAR 8.4 da fase-7) está agendado para 2026-06-13 ou posterior — vai aparecer na
próxima entrada deste changelog._

### Fixed

- **iOS Safari sobre LAN**: `trustHost: true` adicionado em `src/lib/auth.ts` (sessão
  pré-master spec, registrada em `.kiro/specs/_archive/ios-mobile-interactions-fix/`).

### Security

- **HSTS** adicionado a `next.config.ts > headers` (fase-1).
- **CSP** em Report-Only adicionado a `next.config.ts > headers` (fase-1).
- **`/api/dev/*`** autenticado via `DEV_ENDPOINT_TOKEN` ou sessão admin (fase-1).
- **`/api/cron/*`** por header (`Authorization: Bearer` ou `X-Cron-Secret`); query
  string `?secret=` aceita até 2026-06-15 (fase-1).
- **Rate limiting** em login, upload, wa-click, comentários e visualização de stories
  (fase-1).
- **Whitelist** de hosts em `images.remotePatterns` substituindo curinga `**` (fase-1).
- **Validação Zod** em todas as Server Actions e API Routes que aceitam input do
  usuário (fase-1).

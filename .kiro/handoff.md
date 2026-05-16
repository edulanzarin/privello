# Handoff — Auditoria Geral do Projeto

## Contexto rápido

**Projeto:** Privello — Next.js 16.2.6 (Turbopack), App Router, Prisma + PostgreSQL, NextAuth v5 (Auth.js).

**Regra crítica do projeto** (de `AGENTS.md`): esta versão do Next.js tem breaking changes em relação ao treinamento dos modelos. SEMPRE consultar `node_modules/next/dist/docs/` antes de assumir APIs, convenções ou estrutura de arquivos.

## O que acabou de ser feito

Resolvidos bugs no iPhone acessando via `http://192.168.1.96:3000`. Os sintomas eram: autocomplete de cidade, stories, comentários e botão compartilhar não funcionavam. **A causa raiz NÃO era iOS-específica:**

1. `NextAuth UntrustedHost` recusava sessões vindas do IP da LAN, fazendo `session.user` virar `undefined`
2. Componentes liam `session.user.name` e quebravam com `Cannot read properties of undefined (reading 'name')`
3. A árvore React quebrada inutilizava overlays/handlers — taps "engolidos" eram efeito colateral
4. Modo dev (Turbopack/HMR) mascarava o problema; só apareceu claramente no `npm run build && npm run start`

### Fixes aplicados

- **`src/lib/auth.ts`** — adicionado `trustHost: true` na config do NextAuth
  - ⚠️ Em produção real, trocar por `AUTH_URL=https://dominio.com` no `.env` (trustHost aberto é vetor de host-header attack)
- **`prisma/seed.ts`** linha 640 — substituído cast inseguro `(p as { ratingCount: number })` por filtro com `typeof p.ratingCount === "number" && p.ratingCount > 0`, desbloqueando `next build`

### Spec arquivado

`.kiro/specs/ios-mobile-interactions-fix/` foi removido inteiro porque os requirements assumiam causa raiz iOS-específica que não procedia.

## Próximo objetivo

Auditoria ampla e profunda do projeto inteiro:

- **Backend** — segurança, queries N+1, validação de inputs, rate limiting, error handling, organização de rotas API, jobs/crons
- **Frontend** — performance (RSC vs client), bundle size, lazy-loading, gerenciamento de estado, acessibilidade
- **UX/UI** — comparar implementação contra os mockups em `design/`, consistência visual, fluxos
- **Mobile** — responsividade real em iPhone/Android, tap targets, viewport, keyboard handling, gestures
- **Cross-browser** — Safari (iOS/macOS), Chrome, Firefox, Edge
- **DX/Infra** — Docker, env vars, scripts, CI ausente, testes ausentes, documentação

## Estrutura do projeto

- App Router em `src/app/` com rotas públicas (`/`, `/buscar`, `/cidades`, `/em-alta`, `/em-destaque`, `/p/[slug]`, `/reels`), painéis (`/painel/*`, `/admin/*`), onboarding (`/conta/onboarding/*`), auth (`/entrar`, `/cadastro/*`, `/recuperar-senha`)
- API em `src/app/api/*` (auth, cadastro, cities, media, mp/checkout, mp/webhook, profiles, provider/heartbeat, reels, review, stories, upload, wa-click, cron jobs)
- Prisma schema em `prisma/schema.prisma`
- Mockups das telas principais em `design/`
- Documentos existentes: `ARCHITECTURE.md`, `ARCHITECTURE_AUDIT.md`, `REFACTOR_PLAN.md`, `CLAUDE.md` (vale ler antes de propor mudanças)

## Workflow desejado para o spec

Feature spec, **Requirements-First** (Requirements → Design → Tasks). Nome sugerido: `project-wide-audit` ou similar.

A auditoria pode ser segmentada em fases por área (segurança, performance, mobile, UX) pra não virar um spec monolítico de centenas de tasks.

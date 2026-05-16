# NEXT_SESSION_PROMPT — Documentação completa do código

## Estado atual

- Auditoria do master `auditoria-geral` 100% concluída — 7/7 fases `Done`.
- Lint **zerado** (0 problems, era 71 herdados).
- TypeScript: 0 erros.
- Testes: 305 passando em 36 arquivos.
- Mojibake UTF-8 em 6 arquivos pt-BR corrigido.
- Branch `master`, sincronizada com `origin/master` (último push até `aedafe3`; depois disso commits locais — verificar com `git log origin/master..HEAD`).
- Para o estado completo, ler `.kiro/handoff.md` antes de tudo.

## O que já está documentado (não retocar sem motivo)

- Master spec + 7 spec-filhos em `.kiro/specs/`
- Docs operacionais: `docs/env.md`, `docs/docker.md`, `docs/deploy-vercel.md`, `docs/legacy/README.md`, `.kiro/_archive/README.md`
- 5 ADRs em `docs/adr/0001..0005`
- **Services com JSDoc:** `city.service`, `media.service`, `profile.service`, `subscription.service`, `discover.service`, `financial.service`, `moderation.service`, `reels.service`, `stats.service`, `story.service`, `whatsapp-click.service`
- **Hooks com JSDoc:** `useFocusTrap`, `useFileUpload`, `useScrollLock`, `useEscapeKey`, `useMediaQuery`, `useMediaActions`, `useOptimisticToggle`
- **Primitivos UI com JSDoc:** `Modal`, `Switch`, `Dropdown`, `Toast`, `EmptyState`, `LoadingSkeleton`, `ErrorState`, `MediaLightbox`
- **Core libs:** `auth.ts`, `prisma.ts`, `lib/validation/*`, `lib/security/*`, `rate-limit.ts`
- Lint anti-regressão de tokens e tamanhos de fonte ativo (cf. `eslint.config.mjs`)

## O que FALTA documentar (esta sessão)

A meta é JSDoc + comentários de arquivo em arquivos de produto. Não criar docs novos `.md` — o objetivo aqui é que **o código se explique**.

### Prioridade 1 — Server Actions (alto impacto, ~10 arquivos)

- `src/app/_actions/admin-moderation.ts`
- `src/app/_actions/auth.ts`
- `src/app/_actions/client-profile.ts`
- `src/app/_actions/favorites.ts`
- `src/app/_actions/onboarding.ts`
- `src/app/_actions/password-reset.ts`
- `src/app/_actions/reels.ts`
- `src/app/_actions/stories.ts` (se existe)
- `src/app/_actions/subscription.ts`
- `src/app/_actions/track-view.ts`
- `src/app/_actions/verification.ts`
- `src/app/painel/_actions/provider-settings.ts`

Para cada arquivo, adicionar:

1. **File-level header** com:
   - Caminho do arquivo
   - O que o arquivo cobre (1-2 frases)
   - Convenções: server action, validação Zod, autenticação requerida
   - Cross-refs para `.kiro/specs/fase-1-seguranca/endpoints-zod.md` quando aplicável

2. **JSDoc por exported function** com:
   - O que faz (uma frase)
   - `@param` para cada FormData ou arg, com tipo e validação esperada
   - `@returns` formato `{ error?, issues? }` ou redirect/void
   - Mencionar revalidação (`revalidatePath`/`revalidateTag`) se houver
   - Mencionar rate limit aplicado (qual endpoint da tabela em `endpoints-zod.md`)

### Prioridade 2 — Route Handlers (alto impacto, ~20 arquivos)

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/cron/expire-plans/route.ts`
- `src/app/api/cron/reset-hot/route.ts`
- `src/app/api/dev/reset/route.ts`
- `src/app/api/dev/activate-plans/route.ts`
- `src/app/api/cadastro/iniciar/route.ts`
- `src/app/api/cadastro/verificar/route.ts` (se existe)
- `src/app/api/media/comment/route.ts`
- `src/app/api/media/like/route.ts`
- `src/app/api/mp/checkout/route.ts`
- `src/app/api/mp/webhook/route.ts`
- `src/app/api/profiles/section/route.ts`
- `src/app/api/review/route.ts`
- `src/app/api/stories/view/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/upload-audio/route.ts`
- `src/app/api/upload/verification/route.ts`
- `src/app/api/wa-click/route.ts`
- `src/app/api/cities/route.ts` (se existe)
- `src/app/api/top-cities/route.ts` (se existe)
- `src/app/api/provider/heartbeat/route.ts`

Para cada handler, adicionar:

1. **File-level header** com:
   - Endpoint canônico (`POST /api/foo`)
   - Autenticação (sessão admin? token? webhook signature? público?)
   - Rate limit aplicado (referência exata da tabela em `endpoints-zod.md`)
   - Validação Zod (qual schema)
   - Revalidação de cache (se houver)

2. **JSDoc por export** (`GET`, `POST`, `DELETE`...) com:
   - Body/query esperado
   - Status codes possíveis (200, 400, 401, 403, 429, 500)
   - Side effects (DB writes, fila, email, etc)

### Prioridade 3 — Helpers em `src/lib/` (médio impacto, ~5 arquivos)

- `src/lib/utils.ts` (cn helper)
- `src/lib/email.ts`
- `src/lib/email-templates.ts`
- `src/lib/constants.ts`
- `src/lib/queries.ts` (já marcado como `@deprecated`; só adicionar header explicando o estado híbrido até 2026-06-13)

### Prioridade 4 — Páginas RSC (baixo impacto, ~50 arquivos `page.tsx`)

Adicionar **só** file-level header curto explicando:
- Que rota é (`/p/[slug]`, `/painel/financeiro`, etc)
- Server vs Client (já tem `"use client"` quando client)
- Auth required? Provider only? Admin only?
- Cache strategy (já tem comentário do `force-dynamic` quando aplicável — só adicionar onde falta)

NÃO documentar JSX interno — fica ruidoso. Só o header.

### Prioridade 5 — Componentes de produto (baixo impacto, ~30 arquivos)

- `src/components/profile/*`
- `src/components/painel/*`
- `src/components/discover/*`
- `src/components/stories/*`
- `src/components/reels/*`
- `src/components/admin/*`
- `src/components/marketing/*`
- `src/components/onboarding/*`
- `src/components/support/*`
- `src/components/layout/*`
- `src/components/home/*`
- `src/components/solicitar/*`

Adicionar JSDoc por componente exportado com:
- O que renderiza (1 frase)
- Quais props consome e o que cada uma significa
- Where it's used (consumidores conhecidos)
- Quaisquer side effects (fetches, useEffect com browser API, etc)

NÃO documentar implementações privadas (`function helper()` interno) a menos que tenha lógica não-óbvia.

## Estilo de documentação

- pt-BR consistente com o resto do projeto
- File headers em comment block JSDoc (`/** ... */`)
- 1-3 linhas de descrição é suficiente; expandir só quando há nuance
- Usar bullets para listas
- Cross-refs com path absoluto a partir da raiz do repo
- Quando é refactor de pré-auditoria, mencionar de qual fase veio (`fase-3-backend`, `fase-4-design-system`, etc)

## Workflow recomendado

1. Ler `.kiro/handoff.md` para contexto.
2. Validar baseline antes de começar:
   - `npx tsc --noEmit` deve retornar 0
   - `npm run lint` deve retornar 0
   - `npm run test` deve passar 305+
3. Trabalhar em commits pequenos por prioridade:
   - Commit 1: P1 — server actions (1 commit por subdiretório se ficar grande)
   - Commit 2: P2 — route handlers (1 commit por subdiretório)
   - Commit 3: P3 — helpers
   - Commit 4: P4 — pages
   - Commit 5: P5 — componentes
4. Após cada commit, rodar lint + tsc + test e confirmar que continua verde.
5. **Não introduzir lógica nova.** Só documentação de código existente.
6. Ao terminar, atualizar `.kiro/handoff.md` removendo este item dos pendentes.

## Restrições permanentes

- Workspace: `c:\Users\edulanzarin\Documents\Dev\privello\` apenas.
- NÃO `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force`.
- NÃO mexer em `node_modules`.
- NÃO mudar `prisma/schema.prisma`.
- NÃO mexer em `.env`.
- pt-BR consistente.
- AGENTS.md rule: Next.js 16 tem breaking changes — sempre consultar `node_modules/next/dist/docs/` antes de qualquer decisão técnica em APIs do Next.

## Smoke checks finais (referência ao terminar a sessão)

| Check | Esperado |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run test` | 305+ verdes |
| `npm run lint` | 0 problems |
| `npm run build` | falha pré-existente em `/api/cities` (DB local) — não-regressão |
| `npm run test:e2e -- --list` | 4 projects |

## Followups que NÃO são desta sessão

1. **Migrar uploads para storage externo** (Vercel Blob/R2/S3) — bloqueante para produção real, detalhado em `docs/deploy-vercel.md`.
2. **Smokes browser real** da fase-6 (cabeçalhos em `mockups-diff.md`).
3. **2026-06-13 ou depois** — Wave 5 da fase-7 (cleanup `queries.ts`).
4. **`PRODUCTION_HOSTNAME`** quando o domínio definitivo for confirmado.

## Como invocar esta sessão

> Use o prompt acima como mensagem inicial para um sub-agent ou nova sessão do Kiro. Se quiser autonomia total, adicione: "Pode tomar todas as decisões sozinho, não precisa pedir aprovação. Faça o trabalho até terminar."

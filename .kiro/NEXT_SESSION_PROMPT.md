# NEXT_SESSION_PROMPT — Auditoria Privello concluída

## Estado atual

**Auditoria do master `auditoria-geral` 100% concluída em 2026-05-17.** As 7 fases estão `state: Done`.

- Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- Phase Cards:
  - fase-1-seguranca → Done 2026-05-16T04:47:12Z
  - fase-2-testes → Done 2026-05-16T04:46:53Z
  - fase-3-backend → Done 2026-05-17T00:00:00Z
  - fase-4-design-system → Done 2026-05-17T00:00:00Z
  - fase-5-ux → Done 2026-05-17T00:00:00Z
  - fase-6-mobile-cross-browser → Done 2026-05-17T00:00:00Z
  - fase-7-dx-infra → Done 2026-05-17T00:00:00Z

Para o estado completo, ler primeiro `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\handoff.md`.

## O que NÃO precisa ser feito

- **Não há mais fases pendentes na auditoria.** Não há próxima onda de promoção.
- Não há decisão de produção bloqueada esperando o usuário.
- Não há regressão pendente.

## Followups operacionais não-bloqueantes

Estes itens estão registrados mas **não bloqueiam novos ciclos** — podem ser executados quando convier:

1. **2026-06-13 ou posterior** — executar Wave 5 da fase-7 (Cleanup `src/lib/queries.ts`). Decidir entre Opção A (remoção integral) ou Opção B (manter helpers JUSTIFICADO com nova justificativa). Atualizar `docs/adr/0003-queries-ts-deprecated.md` conforme escolha.
2. **`PRODUCTION_HOSTNAME`** em `.env` real quando o domínio definitivo for confirmado (pendência operacional desde a fase-1).
3. **Smokes browser real da fase-6** (cabeçalhos preparados em `.kiro/specs/fase-6-mobile-cross-browser/mockups-diff.md`):
   - Teclado virtual (login, cadastro, comentário, suporte) em iOS Safari + Android Chrome reais
   - Gestos (pinch em lightbox/story viewer, overscroll em reels-feed, drawer mobile) em iOS Safari + Android Chrome reais
   - Cross-browser desktop Safari + desktop Edge — 3 telas-âncora (`/`, `/p/[slug]`, `/painel`)
4. **Refinar URL específica da primeira run da CI** (opcional) — Tarefa 2.5 da fase-7 já fechada com link genérico de Actions; se quiser URL canônica da run específica, abrir <https://github.com/edulanzarin/privello/actions> e copiar do commit `18b2654`.

## Possíveis próximos ciclos (fora da auditoria atual)

Quando o usuário decidir abrir um novo ciclo de trabalho:

- **Auditoria WCAG ampla** (acessibilidade) — explicitamente fora do escopo da fase-6.
- **App nativo / PWA installable / push notifications** — fora do escopo da fase-6.
- **Refactor de componentes pesados restantes**:
  - `src/components/profile/perfil-editor.tsx` (~23KB)
  - `src/components/reels/reels-feed.tsx` (~15KB)
  - `src/components/stories/story-bar.tsx` (~14KB)
  - `src/components/profile/media-manager.tsx` (~13KB)
- **Cobertura E2E ampla com Playwright** (specs além dos 2 atuais) — Non-Goal de fase-2 e fase-6.
- **Qualquer feature de produto nova** — abrir spec dedicado fora do master `auditoria-geral`.

## Restrições permanentes (válidas em qualquer próximo ciclo)

- Workspace só em `c:\Users\edulanzarin\Documents\Dev\privello\`.
- NÃO rodar `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force`, `format`, `shutdown`. Push manual fica com o usuário.
- NÃO mexer em `node_modules` direto (use `npm install`/`npm ci`).
- NÃO mudar schema do Prisma sem perguntar.
- Idioma pt-BR consistente em specs, código novo e mensagens de commit.
- AGENTS.md rule: Next.js 16.x tem breaking changes — sempre consultar `node_modules/next/dist/docs/` antes de qualquer decisão técnica em APIs do Next; registrar evidência em `requirements.md > §4` do spec-filho ANTES da primeira mudança (regra dura E5).

## Smoke checks finais (referência para o próximo ciclo)

Baseline ao final desta auditoria:

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0, zero erros |
| `npm run test` | 36 files / 305 tests, exit 0 |
| `npm run build` | falha pré-existente em `/api/cities` (DB local) — não é regressão; CI da fase-7 não roda build |
| `npm run lint` | 71 problems (29 errors + 42 warnings) — tolerância em CI via Opção B (`continue-on-error: true`) |
| `npm run test:e2e -- --list` | 4 projects (`ios-safari`, `desktop-chrome`, `desktop-firefox`, `android-chrome`) × 15 specs cada |

Qualquer próximo ciclo deve preservar ou superar essas marcas.

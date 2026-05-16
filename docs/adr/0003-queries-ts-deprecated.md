# ADR 0003 — `queries.ts` em estado híbrido com `@deprecated 2026-05-30`

- **Status**: Aceito (revisão em 2026-06-13)
- **Data**: 2026-05-17

## Contexto

A fase-3-backend (`auditoria-geral > Fase 3`) consolidou 27 funções que viviam em
`src/lib/queries.ts` (god-module legado) na nova camada `src/lib/services/` (9 services
coesos: `subscription`, `profile`, `city`, `media`, `discover`, `story`, `reels`,
`payments`, `support`).

A migração foi feita em **24 consumidores** (`src/app/**`), todos passando a importar
de `@/lib/services` em vez de `@/lib/queries`. Restou um ponto delicado: a
**Property 1** do PBT em `src/lib/services/discover.service.pbt.ts` usa os helpers
`sortProfileCards`, `finalizeDiscoverOrder`, a constante `profileCardInclude` e o tipo
`ProfileCardPayload` como **oráculo de paridade SQL ↔ JS**. Esses helpers ainda vivem
em `src/lib/queries.ts`.

Alternativas consideradas:

- **Remover `queries.ts` integralmente agora**: forçaria mover os helpers para um
  módulo novo (`src/lib/services/discover.service.helpers.ts`?) ou inlinear no PBT
  como snapshot. Decisão protelada para depois da janela de migração para evitar
  reescrever Property 1 sem investigação.
- **Manter re-exports indefinidamente**: viola o princípio de Single Source of Truth;
  cria dois caminhos para a mesma função (`@/lib/queries.X` e `@/lib/services.X`).

## Decisão

Adotamos **estado híbrido (a) + (b)** em `src/lib/queries.ts`:

- **(a)** 27 re-exports de `@/lib/services/*` com header de docstring marcando
  `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`. Garante compatibilidade
  para qualquer import remanescente durante a janela.
- **(b)** Helpers `sortProfileCards`, `finalizeDiscoverOrder`, `profileCardInclude`,
  `ProfileCardPayload` permanecem como **JUSTIFICADO** (oráculo da Property 1).

Janela de revisão: **2026-06-13**. Em ou após essa data, este ADR será atualizado
para uma das duas opções:

- **Opção A — Remoção integral**: `src/lib/queries.ts` deletado; Property 1 migrada
  para snapshot estático. Status do ADR muda para `Substituído por <novo>`.
- **Opção B — Manter helpers JUSTIFICADO**: `src/lib/queries.ts` limpa os 27 re-exports,
  mantém apenas os helpers com nova justificativa apontando para este ADR atualizado e
  nova janela de revisão. Status muda para `Aceito (revisão em <nova data>)`.

A escolha entre A e B é decidida na execução da Wave 5 da fase-7-dx-infra com base
em smoke da Opção A (mover Property 1 para snapshot e validar cobertura).

## Consequências

### Positivas

- Compatibilidade preservada durante a janela — nenhum import remanescente quebra.
- Property 1 do PBT continua com oráculo confiável (helpers mantidos in-place).
- A janela de 14 dias força o cleanup formal sem postergar indefinidamente.

### Negativas

- Débito técnico contínuo até a Wave 5 fechar.
- Dois caminhos para as mesmas 27 funções (legacy `@/lib/queries`, atual `@/lib/services`)
  — leitor pode confundir; mitigado pelo header `@deprecated` e pela ESLint anti-regressão
  da fase-4 (que NÃO cobre ainda imports de `@/lib/queries`, candidato a tarefa futura).

### Neutras

- A Property 1 testa **paridade SQL ↔ JS** (a query Prisma vs. a função pura
  `sortProfileCards`/`finalizeDiscoverOrder`). Mover para snapshot estático é
  ortogonal a essa propriedade — só substitui o oráculo.

## Referências

- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-3-backend/metricas-baseline.md > §5 Decisões`
- `c:/Users/edulanzarin/Documents/Dev/privello/src/lib/queries.ts:1-22` — header `@deprecated`.
- `c:/Users/edulanzarin/Documents/Dev/privello/src/lib/queries.ts:22-72` — re-exports.
- `c:/Users/edulanzarin/Documents/Dev/privello/src/lib/queries.ts:74-145` — helpers JUSTIFICADO.
- `c:/Users/edulanzarin/Documents/Dev/privello/src/lib/services/discover.service.pbt.ts` — Property 1.
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-7-dx-infra/dx-conventions.md > §4 Queries cleanup`

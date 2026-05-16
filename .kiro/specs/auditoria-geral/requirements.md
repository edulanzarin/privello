# Requirements Document

> Auditoria Geral do Projeto Privello — roadmap mestre por fases.

## Introduction

Este spec é o **roadmap mestre** da auditoria técnica do Privello (Next.js 16.2.6, App Router, Prisma 5 + PostgreSQL, NextAuth v5, Tailwind v4). Ele consolida o trabalho que estava espalhado em 5 specs arquivados em `.kiro/specs/_archive/` (`backend-performance-phase5`, `design-system`, `final-polish-phase`, `ux-premium-phase4`, `ux-premium-polish`) e o eleva a um plano único, organizado em **fases**.

O documento é **propositalmente de alto nível**: cada fase delimitada aqui dará origem a um spec-filho próprio, com seu próprio design e tarefas. Os requisitos abaixo definem o **escopo, as fronteiras e os critérios de aceitação por fase**, não a implementação.

### Observações da varrida inicial (insumo para validação do escopo)

- **Backend / segurança**
  - `MercadoPago webhook` já valida assinatura HMAC-SHA256 (`src/app/api/mp/webhook/route.ts`) — não é mais lacuna, mas precisa de testes.
  - `next.config.ts` já aplica X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy. **Sem CSP**.
  - `next.config.ts > images.remotePatterns` contém `{ hostname: "**" }` — abre o otimizador para qualquer host HTTPS.
  - `/api/dev/reset` é gateado apenas por `NODE_ENV !== "production"`. Sem token, sem auth, sem confirmação.
  - `/api/cron/expire-plans` aceita `?secret=` em query string (loga em servidor/proxy/CDN). Falta padronizar por header.
  - `/api/upload` valida Content-Length, MIME e tamanho por categoria. **Sem rate limit**.
  - `src/lib/auth.ts` está com `trustHost: true` aberto. Precisa de documentação para produção (definir `AUTH_URL`).
  - **Zero ocorrências de `zod`** em `src/`. Zero rate limiting. Zero testes unitários ou de propriedade.
- **Backend / correção e performance**
  - `getProfileBySlug` puxa `media` sem paginação e `reviews` com `include user` (potencial N+1).
  - **43 páginas com `export const dynamic = "force-dynamic"`** — muitas dessas poderiam ser cacheadas.
  - Sort em memória em `getSectionProfiles` (deveria ir para SQL).
  - Camada de serviços iniciada (`subscription`, `profile`, `city`, `media`); `queries.ts` ainda em uso paralelo.
  - Next 16 traz **Cache Components** (`use cache` + `cacheLife` + `cacheTag`) e **View Transitions** — a regra de `AGENTS.md` exige consultar `node_modules/next/dist/docs/` antes de adotar qualquer uma.
- **Design system**
  - Tokens existem (`globals.css`) mas convivem com cores hex hardcoded no JSX.
  - Sem variáveis dedicadas para `warning` / `danger` / `blue` em variantes de opacidade.
  - Faltam primitivos (Dropdown, focus trap reutilizável).
- **UX premium**
  - `~78 rotas` no App Router contra **4 `loading.tsx`** e **4 `error.tsx`**.
  - Sem View Transitions (Next 16). Sem padrão claro de UI otimista.
  - `~10 ocorrências de aria-label` no projeto inteiro.
- **Mobile / cross-browser**
  - Pasta `design/` tem 11 PNGs de referência ainda não comparados sistematicamente com a implementação.
  - `playwright.config.ts` existe, mas não há cobertura real de fluxos críticos.
- **DX / Infra**
  - Sem CI configurada para lint/typecheck/testes.
  - `docker-compose.yml` presente mas não auditado.
  - Variáveis de ambiente não documentadas em um único arquivo.
  - Componentes grandes pendentes: `media-gallery.tsx` (~23KB), `perfil-editor.tsx` (~23KB), `reels-feed.tsx` (~15KB), `story-bar.tsx` (~14KB), `media-manager.tsx` (~13KB).

### Princípios deste roadmap

- Cada **fase** é independente o suficiente para virar um spec-filho com escopo próprio.
- Os achados dos specs arquivados são **referência histórica**, não fonte de verdade. Cada item absorvido **será revalidado contra o estado atual do código** dentro do spec-filho da fase correspondente.
- Toda decisão que dependa de APIs do Next.js **deve consultar** `node_modules/next/dist/docs/` antes (regra de `AGENTS.md`).
- Documento, design e tarefas serão escritos em **pt-BR**.

---

## Glossary

- **Master spec**: este documento. Define fases, fronteiras e critérios de aceitação amplos. Não detalha implementação.
- **Phase spec (spec-filho)**: spec independente, criado a partir de uma fase deste roadmap, com requirements/design/tasks próprios e bounded scope.
- **Bug condition**: condição reproduzível que caracteriza uma falha (entrada + estado + comportamento esperado vs. observado).
- **EARS** (Easy Approach to Requirements Syntax): formato de requisitos em frases padronizadas (Ubiquitous, Event-driven, State-driven, Unwanted, Optional, Complex).
- **AGENTS_Rule**: instrução em `AGENTS.md` que obriga consulta a `node_modules/next/dist/docs/` antes de qualquer assunção sobre APIs do Next.js.
- **force-dynamic**: diretiva `export const dynamic = "force-dynamic"` que desabilita cache estático/ISR de uma rota.
- **RSC (React Server Component)**: componente executado no servidor por padrão no App Router.
- **Cache Components**: feature do Next 16 que permite marcar partes de RSCs como cacheáveis com `"use cache"`, `cacheLife` e `cacheTag`.
- **View Transitions**: API de transições visuais entre estados/rotas suportada pelo Next 16.
- **Service layer**: módulos em `src/lib/services/*.service.ts` que encapsulam lógica de negócio, substituindo gradualmente `src/lib/queries.ts`.
- **Phase spec spawn-readiness**: estado em que uma fase tem escopo, entradas, saídas e critérios suficientemente claros para um spec-filho ser iniciado sem nova rodada de descoberta.
- **Privello_Audit**: o sistema deste spec — o conjunto de fases, fronteiras e critérios definidos aqui.

---

## Non-Goals / Out of Scope

Os itens abaixo **não** fazem parte desta auditoria e não devem aparecer em specs-filhos derivados:

1. Lançamento de novas funcionalidades de negócio (novos fluxos, novas telas, novos modelos de monetização).
2. Redesign visual amplo. Ajustes serão limitados a aderência ao design system existente e aos mockups em `design/`.
3. Mudanças no schema de banco que não sejam consequência direta de uma fase (ex.: novos índices, novas colunas exigidas por correção). Migrations grandes ficam fora.
4. Substituição de stack (ex.: trocar NextAuth, Prisma, Tailwind, MercadoPago).
5. Internacionalização (i18n).
6. Marketing, copy de landing, SEO ofensivo.
7. Migração de hospedagem ou infraestrutura cloud (a não ser documentação mínima de CI/Docker).
8. Implementação completa dos itens — cada fase entrega o **plano e os critérios**; a execução roda nos specs-filhos.

---

## Requirements

### Requirement 1: Estrutura mestre e governança das fases

**User Story:** Como tech lead do Privello, quero um roadmap único organizado em fases com fronteiras claras, para que cada fase possa virar um spec-filho independente sem retrabalho de descoberta.

#### Acceptance Criteria

1. THE Privello_Audit SHALL listar exatamente 7 fases com identificadores estáveis (`fase-1-seguranca`, `fase-2-testes`, `fase-3-backend`, `fase-4-design-system`, `fase-5-ux`, `fase-6-mobile-cross-browser`, `fase-7-dx-infra`).
2. THE Privello_Audit SHALL declarar para cada fase: objetivo, entradas (arquivos/áreas tocadas), saídas esperadas, critérios de pronto e itens fora de escopo.
3. THE Privello_Audit SHALL referenciar os 5 specs arquivados em `.kiro/specs/_archive/` apenas como contexto histórico, sem tratá-los como fonte de verdade.
4. WHEN uma fase deste roadmap é promovida a spec-filho, THE Phase_Spec SHALL revalidar cada item herdado dos specs arquivados contra o estado atual do código antes de aceitá-lo como tarefa, classificando-o em um dos três estados do protocolo de Revalidação descrito em `design.md > Components and Interfaces > Child Spec Bridge`: `Confirmado` (item ainda válido contra o código atual), `Resolvido` (já tratado; remove da lista de tarefas, com link para commit/arquivo que comprova) ou `Reescopado` (descrição atualizada para refletir o estado real). Itens marcados ✅ em `design.md > Estado de partida` entram automaticamente como `Resolvido` e SHALL NOT ser absorvidos como tarefas pelo spec-filho.
5. THE Privello_Audit SHALL documentar a regra de `AGENTS.md` (consultar `node_modules/next/dist/docs/`) como precondição para qualquer fase que dependa de APIs do Next.js.
6. WHERE uma fase tiver dependência técnica em outra (ex.: testes antes de refactor de performance), THE Privello_Audit SHALL declarar a dependência explicitamente em "entradas".

### Requirement 2: Fase 1 — Endurecimento de segurança

**User Story:** Como mantenedor, quero um spec-filho de segurança que feche superfícies de ataque conhecidas, para reduzir risco de abuso, fraude e exposição em produção.

#### Phase Card

- **id**: `fase-1-seguranca`
- **objective**: Fechar superfícies de ataque conhecidas em endpoints de dev/cron, otimizador de imagens, validação de input, rate limit, configuração do NextAuth e headers, antes que outras fases otimizem ou refaçam fluxos sobre essas mesmas rotas.
- **inputs**:
  - Arquivos: `next.config.ts`, `src/lib/auth.ts`, `src/app/api/dev/**/*.ts`, `src/app/api/cron/**/*.ts`, `src/app/api/upload/route.ts`, todas as Server Actions e Route Handlers que aceitam input do usuário.
  - Áreas: configuração de `images.remotePatterns`, headers em `next.config.ts`, middleware/proxy.
  - Fases predecessoras: nenhuma.
- **outputs**:
  - Código: `/api/dev/*` autenticado (sessão de admin ou token dedicado); `/api/cron/*` consumindo segredo via header (`Authorization: Bearer` ou `X-Cron-Secret`) com transição compatível; whitelist explícita de hosts em `images.remotePatterns`; schemas Zod aplicados nos endpoints listados; módulo de rate limit instalado e aplicado em login, upload, `wa-click`, comentários e visualização de stories.
  - Config: `AUTH_URL` documentada para produção em substituição a `trustHost: true` aberto; avaliação registrada de inclusão de Content-Security-Policy e Strict-Transport-Security com critérios de teste.
  - Doc: lista canônica de endpoints alvo de Zod e tabela de limites de rate limit por endpoint (valor + janela).
- **out_of_scope**: rotação de chaves, auditoria de dependências (SCA) e WAF — vão para DX/Infra ou spec próprio futuro.
- **historical_refs**: nenhum (a Fase 1 não herda de specs arquivados em `.kiro/specs/_archive/`; segurança não foi tema de spec arquivado).
- **agents_rule_areas**: `images-config` (whitelist em `images.remotePatterns`), `headers` (avaliação de CSP/HSTS e demais headers de segurança em `next.config.ts`).
- **state**: `Done`
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\`
- **promoted_at**: 2026-03-14
- **doneAt**: 2026-05-16T04:47:12Z
- **spawn_readiness_note**: Spawn-Readiness Gate re-avaliado para fase-3 e fase-7 (dependentes diretas); ambas agora têm fase-1 + fase-2 satisfeitas, gate plenamente atendido — orquestrador/usuário pode iniciar fase-3 ou fase-7 a seguir.

<!-- Já resolvido (cf. `design.md > Estado de partida`) — entram como `Resolvido` na Revalidação do spec-filho e NÃO viram tarefa de entrega:
  - Webhook MercadoPago com HMAC-SHA256 (`src/app/api/mp/webhook/route.ts`); só o teste/cobertura desse fluxo pode ser herdado pela Fase 2.
  - Headers básicos em `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
  - Validação de Content-Length, MIME e tamanho por categoria em `/api/upload`; o que falta é rate limit (EAR 5) e Zod no payload (EAR 4), não a validação já existente. -->

#### Acceptance Criteria

1. THE Phase_1_Spec SHALL cobrir endurecimento de `/api/dev/*`, exigindo, além de `NODE_ENV !== "production"`, autenticação (sessão de admin ou token dedicado).
2. THE Phase_1_Spec SHALL substituir o segredo em query string de `/api/cron/*` por header (ex.: `Authorization: Bearer <CRON_SECRET>` ou `X-Cron-Secret`), mantendo compatibilidade durante a transição.
3. THE Phase_1_Spec SHALL definir whitelist explícita em `next.config.ts > images.remotePatterns`, removendo o curinga `hostname: "**"`, e SHALL exigir consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `images-config`) antes de adotar a forma final da whitelist.
4. THE Phase_1_Spec SHALL exigir validação de entrada com Zod em todas as Server Actions e API Routes que aceitem input do usuário, listando os endpoints alvo.
5. THE Phase_1_Spec SHALL definir rate limiting para login, upload, `wa-click`, comentários e visualização de stories, com limites positivos e mensuráveis por janela (qualquer valor ≥ 1 req/min é aceitável, desde que o número e a janela sejam declarados explicitamente por endpoint).
6. THE Phase_1_Spec SHALL documentar a configuração de produção do NextAuth (`AUTH_URL` em `.env`) substituindo `trustHost: true` aberto.
7. WHERE houver headers de segurança ausentes em `next.config.ts`, THE Phase_1_Spec SHALL avaliar inclusão de Content-Security-Policy e Strict-Transport-Security, com critérios de teste, exigindo consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `headers`) antes de definir a forma final dos headers. <!-- Já resolvido: X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Permissions-Policy já estão aplicados em `next.config.ts` (ver `design.md > Estado de partida`). Esses quatro headers entram como `Resolvido` na Revalidação do spec-filho e NÃO são entregáveis desta fase. O escopo de entrega aqui são exclusivamente CSP e HSTS. -->
8. THE Phase_1_Spec SHALL declarar fora de escopo: rotação de chaves, auditoria de dependências (SCA) e WAF — esses itens ficam em DX/Infra ou em spec próprio futuro.

### Requirement 3: Fase 2 — Infraestrutura de testes

**User Story:** Como dev do Privello, quero infraestrutura de testes unitários e baseados em propriedade configurada, para que as fases seguintes possam refatorar com rede de proteção.

#### Phase Card

- **id**: `fase-2-testes`
- **objective**: Instalar e padronizar a infraestrutura de testes unitários e baseados em propriedade (Vitest + fast-check) que será consumida pelas fases de refactor (Fase 3) e usada como gate na CI (Fase 7).
- **inputs**:
  - Arquivos: `package.json`, `tsconfig.json`, módulos puros em `src/lib/` (com foco em `discover-params`, `booking-slots`, `time-utils`, `money`, `whatsapp-booking`).
  - Áreas: scripts npm, configuração do runner, convenções de localização e nomenclatura de testes.
  - Fases predecessoras: nenhuma (a Fase 7 consome esta saída na CI).
- **outputs**:
  - Código: configuração de Vitest + fast-check; primeiros testes de propriedade round-trip por parser/serializador identificado em `src/lib/`.
  - Config: scripts npm `test`, `test:watch`, `test:run` (com `--run` por padrão em CI); meta inicial de cobertura para módulos puros listados.
  - Doc: convenções de nomenclatura (`*.test.ts` ao lado do código, `*.pbt.ts` para property-based) e fluxo recomendado para persistência de contraexemplos.
- **out_of_scope**: cobertura de componentes React via Testing Library e ampliação dos testes Playwright — entram em fases posteriores.
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5`
- **state**: `Done`
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-2-testes\`
- **promoted_at**: 2026-03-14
- **doneAt**: 2026-05-16T04:46:53Z
- **spawn_readiness_note**: Spawn-Readiness Gate re-avaliado para fase-3, fase-4, fase-5 e fase-7 (dependentes diretas); gate executável quando suas próprias dependências forem satisfeitas (ex.: fase-3 depende também de fase-1).

#### Acceptance Criteria

1. THE Phase_2_Spec SHALL configurar Vitest e fast-check no projeto, com scripts npm (`test`, `test:watch`, `test:run`) que rodem em `--run` por padrão em CI.
2. THE Phase_2_Spec SHALL definir convenções de localização e nomenclatura de testes (ex.: `*.test.ts` ao lado do código, `*.pbt.ts` para property-based).
3. THE Phase_2_Spec SHALL estabelecer cobertura inicial mínima como meta para módulos puros em `src/lib/` (ex.: `discover-params`, `booking-slots`, `time-utils`, `money`, `whatsapp-booking`).
4. THE Phase_2_Spec SHALL incluir pelo menos uma propriedade round-trip por parser/serializador identificado em `src/lib/`.
5. WHEN um teste de propriedade falha localmente, THE Phase_2_Spec SHALL recomendar que o contraexemplo seja persistido em comentário ou arquivo dedicado para regressão, sem bloquear o commit (responsabilidade do desenvolvedor).
6. THE Phase_2_Spec SHALL integrar a execução dos testes na pipeline de CI definida na Fase 7.
7. THE Phase_2_Spec SHALL declarar fora de escopo: cobertura de componentes React (Testing Library) e ampliação dos testes Playwright — entram em fases posteriores.

### Requirement 4: Fase 3 — Correção e performance de backend

**User Story:** Como provider/cliente do Privello, quero páginas e APIs rápidas e corretas, para que o produto escale sem regressões silenciosas.

#### Phase Card

- **id**: `fase-3-backend`
- **objective**: Corrigir gargalos conhecidos (N+1 em `getProfileBySlug`, sorts em memória) e classificar as 43 rotas com `force-dynamic` quanto à estratégia de cache adequada, concluindo a migração de `queries.ts` para a camada de services com paridade comportamental garantida.
- **inputs**:
  - Arquivos: `src/lib/queries.ts`, `src/lib/services/*.service.ts`, módulos consumidores em `src/app/**` e `src/components/**`, `next.config.ts` quando aplicável a route segment config.
  - Áreas: rotas com `export const dynamic = "force-dynamic"`, ordenações em memória, queries Prisma com risco de N+1.
  - Fases predecessoras: Fase 1 (segurança) concluída para evitar re-otimizar fluxos cuja semântica ainda mudará; Fase 2 (testes) concluída para fornecer rede de proteção em refactors.
- **outputs**:
  - Código: paginação de mídia e batching de reviews em `getProfileBySlug`; sorts movidos para `ORDER BY` no Prisma; conteúdo restante de `queries.ts` migrado para services ou explicitamente justificado.
  - Config: classificação caso a caso das 43 rotas (`static`, `revalidate=N`, `dynamic` justificado, ou candidata a Cache Components).
  - Métrica: para cada otimização aplicada, antes/depois de pelo menos uma entre tempo de resposta médio (em desenvolvimento) ou número de queries por requisição.
- **out_of_scope**: troca de ORM, troca de banco, sharding e leitura de réplica.
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5`
- **agents_rule_areas**: `cache-components` (`"use cache"`, `cacheLife`, `cacheTag` quando aplicáveis), `route-segment-config` (classificação das 43 rotas com `force-dynamic` quanto a `dynamic`/`revalidate`/`fetchCache`), `server-actions` (revisão de Server Actions tocadas durante a migração `queries.ts` → `services/`).
- **state**: `InProgress`
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-3-backend\`
- **promoted_at**: 2026-05-16

<!-- Já resolvido (cf. `design.md > Estado de partida`) — entram como `Resolvido` na Revalidação do spec-filho e NÃO viram tarefa de entrega:
  - Camada `src/lib/services/` já iniciada com `subscription`, `profile`, `city` e `media`; o trabalho desta fase é concluir a migração (EAR 5), não criar a estrutura inicial.
  - Índices em Prisma já adicionados: `Profile` (`planTier+planExpiresAt`, `isOnline+cityId`, `featuredUntil`) e `Subscription` (`userId+status+expiresAt`). Novos índices só entram nesta fase se justificados como consequência direta de uma otimização (cf. seção "Non-Goals", item 3); os listados acima NÃO devem ser re-propostos. -->

#### Acceptance Criteria

1. THE Phase_3_Spec SHALL identificar e corrigir N+1 em `getProfileBySlug` (paginação de mídia, batching de reviews/usuários).
2. THE Phase_3_Spec SHALL revisar as 43 rotas com `force-dynamic` e classificar cada uma como `static`, `revalidate=N`, `dynamic` justificado, ou candidata a Cache Components, exigindo consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `route-segment-config`) antes de alterar a configuração de cada rota.
3. WHERE Cache Components forem aplicáveis, THE Phase_3_Spec SHALL exigir consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `cache-components`) antes de adotar `"use cache"`, `cacheLife`, `cacheTag`.
4. THE Phase_3_Spec SHALL mover ordenações em memória (ex.: `getSectionProfiles`) para `ORDER BY` no SQL/Prisma, mantendo a paridade de resultado validada por teste.
5. THE Phase_3_Spec SHALL considerar a migração de `src/lib/queries.ts` para `src/lib/services/*.service.ts` concluída somente quando todo conteúdo restante em `queries.ts` estiver migrado ou tiver justificativa explícita registrada (ambas condições obrigatórias); WHERE a migração tocar Server Actions, exigir consulta prévia a `node_modules/next/dist/docs/` (AGENTS_Rule, área `server-actions`).
6. THE Phase_3_Spec SHALL incluir métricas de antes/depois para cada otimização aplicada — ao menos uma entre tempo de resposta médio (em desenvolvimento) ou número de queries por requisição é suficiente por otimização.
7. THE Phase_3_Spec SHALL declarar fora de escopo: troca de ORM, troca de banco, sharding e leitura de réplica.

### Requirement 5: Fase 4 — Aplicação do design system

**User Story:** Como designer/dev do Privello, quero o design system efetivamente aplicado, para que cores, tipografia, sombras e primitivos sejam consumidos via tokens em todo o código.

#### Phase Card

- **id**: `fase-4-design-system`
- **objective**: Completar o conjunto de tokens semânticos, eliminar literais hardcoded em `src/components/**` e `src/app/**`, entregar primitivos faltantes consistentes com Modal/Switch e consolidar implementações duplicadas, deixando o terreno pronto para Fase 5 (UX) e Fase 6 (mobile/cross-browser).
- **inputs**:
  - Arquivos: `src/app/globals.css`, todos os arquivos JSX/TSX em `src/components/**` e `src/app/**` que hoje usam cores hex ou tamanhos de fonte arbitrários, primitivos existentes (`Modal`, `Switch`).
  - Áreas: tokens semânticos (`warning`, `danger`, `blue` e variantes de opacidade), primitivos novos (Dropdown, focus trap), implementações duplicadas (Switch, fluxos de upload, modais/overlays).
  - Fases predecessoras: Fase 2 (rede de proteção sobre refactors de componentes).
- **outputs**:
  - Código: tokens completos em `globals.css`; substituição sistemática de hex e tamanhos arbitrários por tokens/utilitários; primitivos `Dropdown` e focus trap reutilizável publicados; consolidação dos componentes duplicados identificados.
  - Config: lint ou checklist anti-regressão (cor hex literal, tamanho de fonte arbitrário) acionável em PRs.
  - Doc: tabela das variantes de opacidade documentadas para `warning`, `danger` e `blue`.
- **out_of_scope**: redesign visual e introdução de bibliotecas externas de UI (Radix, shadcn etc.).
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\design-system`
- **agents_rule_areas**: nenhuma (a fase NÃO toca APIs do Next.js)
- **state**: `InProgress`
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\`
- **promoted_at**: 2026-05-16

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL completar o conjunto de tokens semânticos para `warning`, `danger` e `blue`, incluindo variantes de opacidade documentadas.
2. THE Phase_4_Spec SHALL eliminar cores hexadecimais e tamanhos tipográficos hardcoded em `src/components/**` e `src/app/**`, substituindo-os por tokens/classes utilitárias.
3. THE Phase_4_Spec SHALL entregar primitivos faltantes mínimos (Dropdown e focus trap reutilizável) com API consistente com `Modal` e `Switch` existentes antes da entrega; primitivos sem essa consistência não são aceitos como concluídos.
4. THE Phase_4_Spec SHALL definir um lint ou checklist que detecte regressões (cor hex literal, tamanho de fonte arbitrário) em PRs.
5. THE Phase_4_Spec SHALL identificar proativamente componentes com lógica equivalente em `src/components/**` e `src/app/**` (ex.: implementações de Switch, fluxos de upload, modais/overlays) e consolidá-los em primitivas ou hooks únicos, mesmo quando ainda não foram tratados como duplicação explícita.
6. THE Phase_4_Spec SHALL declarar fora de escopo: redesign visual e introdução de bibliotecas externas de UI (Radix, shadcn etc.).

### Requirement 6: Fase 5 — Polimento de UX premium

**User Story:** Como usuário, quero feedback visual consistente em carregamento, erro e transições, para que a experiência pareça fluida em todas as rotas.

#### Phase Card

- **id**: `fase-5-ux`
- **objective**: Padronizar feedback de carregamento, erro e transição em todas as rotas relevantes do App Router, introduzindo View Transitions e UI otimista onde fizer sentido, sem comprometer `prefers-reduced-motion`.
- **inputs**:
  - Arquivos: ~78 rotas em `src/app/**`, `loading.tsx` e `error.tsx` existentes, componentes de lista e ações frequentes (curtir, favoritar, marcar visto).
  - Áreas: View Transitions do Next 16, padrão de UI otimista, EmptyState reutilizável, microinterações.
  - Fases predecessoras: Fase 2 (testes) e Fase 4 (tokens e primitivos consolidados antes de padronizar telas vazias/erro).
- **outputs**:
  - Código: `loading.tsx` e `error.tsx` cobrindo as rotas classificadas como necessárias; primitivo `EmptyState` aplicado em listas vazias (busca, favoritos, histórico, financeiro); padrão de UI otimista com rollback em erro implementado nas ações listadas; View Transitions adotadas onde a avaliação aprovar.
  - Config: registro da consulta a `node_modules/next/dist/docs/` para View Transitions (AGENTS_Rule).
  - Doc: inventário das ~78 rotas com classificação (necessita `loading.tsx`/`error.tsx` ou não) e justificativa.
- **out_of_scope**: acessibilidade ampla (auditoria WCAG completa entra em fase futura ou Fase 6 quando ligada a mobile/screen reader).
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-phase4`
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`
- **agents_rule_areas**: `view-transitions` (avaliação e adoção da API de View Transitions do Next 16 nas rotas onde for aplicável).

#### Acceptance Criteria

1. THE Phase_5_Spec SHALL inventariar as ~78 rotas e classificar quais precisam de `loading.tsx` próprio, partindo da meta de cobrir 100% das rotas com tela autenticada e/ou listagem dinâmica.
2. THE Phase_5_Spec SHALL inventariar as rotas que precisam de `error.tsx` (no mínimo todas as `loading.tsx` correspondentes), com fallback acessível e botão "Tentar novamente".
3. WHERE for aplicável, THE Phase_5_Spec SHALL avaliar uso de View Transitions do Next 16, respeitando AGENTS_Rule (consultar `node_modules/next/dist/docs/`, área `view-transitions`).
4. THE Phase_5_Spec SHALL definir padrão de UI otimista para ações frequentes (curtir, favoritar, marcar visto), com rollback em caso de erro.
5. THE Phase_5_Spec SHALL exigir conformidade com `prefers-reduced-motion` em todas as microinterações introduzidas.
6. THE Phase_5_Spec SHALL definir EmptyState reutilizável e sua aplicação em listas vazias (busca, favoritos, histórico, financeiro).
7. THE Phase_5_Spec SHALL declarar fora de escopo: acessibilidade ampla (auditoria WCAG completa entra em fase futura ou Fase 6 quando ligada a mobile/screen reader).

### Requirement 7: Fase 6 — Mobile, cross-browser e fidelidade aos mockups

**User Story:** Como usuário em iPhone Safari, Android Chrome, desktop Safari/Firefox/Edge, quero que o produto se comporte como mostrado nos mockups, para ter uma experiência consistente.

#### Phase Card

- **id**: `fase-6-mobile-cross-browser`
- **objective**: Garantir paridade comportamental e visual em iPhone Safari, Android Chrome, desktop Safari/Firefox/Edge, alinhando a implementação aos 11 mockups em `design/` e tratando especificidades de toque, teclado virtual e gestos.
- **inputs**:
  - Arquivos: telas correspondentes aos 11 PNGs de `design/`; controles interativos críticos em `src/components/**` e `src/app/**`; fluxos de login, cadastro, comentário e suporte; modais que podem virar bottom-sheets em mobile.
  - Áreas: matriz de validação de browsers, alvo de toque mínimo, teclado virtual, padrão de bottom-sheet, gestos (overscroll, pinch, pull-to-refresh).
  - Fases predecessoras: Fase 4 (tokens e primitivos prontos) e Fase 5 (loading/error/EmptyState padronizados antes do diff visual).
- **outputs**:
  - Código: ajustes de toque mínimo (44×44 px) em controles críticos; tratamento de teclado virtual nos fluxos listados; bottom-sheets aplicados onde apropriado; correções de gestos por plataforma.
  - Doc: matriz de browsers com versões mínimas alvo; diff visual entre cada mockup em `design/` e a tela correspondente, registrando divergências aceitas e divergências a corrigir.
- **out_of_scope**: app nativo (iOS/Android), PWA installable e push notifications.
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\ux-premium-polish`
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

#### Acceptance Criteria

1. THE Phase_6_Spec SHALL definir matriz de validação cobrindo iPhone Safari, Android Chrome, desktop Safari, Firefox e Edge, com versões mínimas alvo.
2. THE Phase_6_Spec SHALL exigir alvo mínimo de toque de 44x44 px em controles interativos críticos (botões de ação, ícones de navegação, fechar modal).
3. THE Phase_6_Spec SHALL cobrir tratamento de teclado virtual (resize de viewport, foco em inputs) nos fluxos de login, cadastro, comentário e suporte.
4. THE Phase_6_Spec SHALL definir padrão de bottom-sheet para ações secundárias em mobile, substituindo modais full-screen onde apropriado.
5. THE Phase_6_Spec SHALL produzir um diff visual entre cada mockup em `design/` (11 PNGs) e a tela correspondente implementada, registrando divergências aceitas e divergências a corrigir.
6. WHEN forem identificadas divergências de gesto/scroll (overscroll, pinch, pull-to-refresh), THE Phase_6_Spec SHALL especificar o comportamento esperado por plataforma.
7. THE Phase_6_Spec SHALL declarar fora de escopo: app nativo (iOS/Android), PWA installable e push notifications.

### Requirement 8: Fase 7 — DX e infraestrutura

**User Story:** Como mantenedor, quero CI, documentação de ambiente e limpeza de dívida estrutural, para que o projeto fique sustentável após a auditoria.

#### Phase Card

- **id**: `fase-7-dx-infra`
- **objective**: Tornar o projeto sustentável após a auditoria com CI cobrindo lint/typecheck/testes, documentação única de variáveis de ambiente e Docker, e a finalização da limpeza estrutural iniciada nas fases anteriores.
- **inputs**:
  - Arquivos: `eslint.config.mjs`, `tsconfig.json`, `package.json`, `docker-compose.yml`, `.env`/`.env.example` se existirem, `src/lib/queries.ts` e `src/lib/services/*` (em coordenação com a Fase 3).
  - Áreas: pipeline de CI, documentação de ambiente, ADRs e changelog, ocorrências de `any` em `src/`.
  - Fases predecessoras: Fase 1 (rate limit/headers no fluxo de build), Fase 2 (testes existem para serem rodados na CI) e Fase 3 (services consolidados antes de finalizar limpeza).
- **outputs**:
  - Config: pipeline de CI com 3 estágios (lint via `eslint`, typecheck via `tsc --noEmit`, testes via Vitest da Fase 2); convenção de ADRs com modelo e local de armazenamento; modelo de changelog.
  - Doc: documento único de variáveis de ambiente (descrição, exemplo, ambiente alvo); documentação de uso do `docker-compose.yml` (variáveis necessárias, portas, volumes).
  - Código: eliminação da duplicação `queries.ts` ↔ `services/*` (ou justificativa explícita do legado isolado); plano numérico de redução de `any` quando o limite for excedido.
- **out_of_scope**: monitoramento em produção (APM/log shipping), feature flags e blue/green deploy.
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\final-polish-phase`

#### Acceptance Criteria

1. THE Phase_7_Spec SHALL definir pipeline de CI com pelo menos 3 estágios: lint (`eslint`), typecheck (`tsc --noEmit`) e testes (Vitest, conforme Fase 2).
2. THE Phase_7_Spec SHALL revisar `docker-compose.yml` e produzir documentação de uso (variáveis necessárias, portas, volumes) em README ou doc dedicado.
3. THE Phase_7_Spec SHALL produzir documento único listando todas as variáveis de ambiente requeridas, com descrição, exemplo e ambiente alvo (dev/prod).
4. THE Phase_7_Spec SHALL eliminar duplicação entre `src/lib/queries.ts` e `src/lib/services/*` (ou justificar e isolar o legado), em coordenação com a Fase 3.
5. WHERE houver mais de 5 ocorrências de `any` em `src/`, THE Phase_7_Spec SHALL planejar redução com meta numérica medida antes/depois; abaixo desse limite, basta registrar a contagem atual sem plano formal de redução.
6. THE Phase_7_Spec SHALL definir convenção de ADRs (Architecture Decision Records) e changelog do projeto, com modelo e local de armazenamento.
7. WHEN uma fase anterior introduzir scripts ou ferramentas (Vitest, lint extra), THE Phase_7_Spec SHALL garantir que estejam refletidos na CI.
8. THE Phase_7_Spec SHALL declarar fora de escopo: monitoramento em produção (APM/log shipping), feature flags e blue/green deploy.

### Requirement 9: Critérios de spawn-readiness para specs-filhos

**User Story:** Como agente que vai criar os specs-filhos, quero saber quando uma fase deste roadmap está pronta para virar um spec dedicado, para evitar specs incompletos ou sobrepostos.

#### Acceptance Criteria

1. WHEN objetivo, entradas, saídas, critérios de pronto e itens fora de escopo de uma fase estiverem preenchidos sem ambiguidade, THE Privello_Audit SHALL marcar essa fase automaticamente como "spawn-ready".
2. WHEN um spec-filho é criado a partir de uma fase, THE Phase_Spec SHALL referenciar este master spec por caminho absoluto e o identificador da fase (`fase-N-...`).
3. IF um item descoberto durante o spec-filho extrapolar o escopo da fase, THEN THE Phase_Spec SHALL registrá-lo como "achado fora de escopo" e propor seu retorno ao master spec, sem absorvê-lo silenciosamente.
4. THE Privello_Audit SHALL ser atualizado quando uma fase concluir, marcando-a como done e registrando link para o spec-filho correspondente.

# Requirements Document

> Spec-filho `fase-4-design-system` promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## Introduction

Este spec-filho executa a **Fase 4 — Aplicação do design system** do roadmap mestre `auditoria-geral`. O objetivo é completar o conjunto de tokens semânticos, eliminar literais hardcoded em `src/components/**` e `src/app/**`, entregar primitivos faltantes consistentes com Modal/Switch e consolidar implementações duplicadas, deixando o terreno pronto para Fase 5 (UX) e Fase 6 (mobile/cross-browser).

A fase **depende apenas** de `fase-2-testes` (já em `state: Done` no master) e é **paralelizável** com `fase-3-backend` — as duas tocam superfícies disjuntas (UI tokens/primitivos vs. queries/cache). A fase **não toca APIs do Next.js** (não mexe em routing, server actions, middleware, cache, transitions, image config nem headers); por isso a §4 deste documento registra `n/a` para AGENTS_Rule. Se durante a execução algo exigir tocar API do Next, deve virar `OutOfScopeFinding`, não absorver.

Os EARS herdados do `Requirement 5` do master spec definem o resultado esperado; novos requisitos abaixo destrincham as superfícies tocadas e adicionam EARS de detalhe verificáveis. Achados que extrapolarem o escopo voltam ao master via `OutOfScopeFinding` (§3). O spec arquivado `_archive/design-system` é a única referência histórica desta fase, e cada um dos 18 Requirements de lá é revalidado contra o código atual em §2.

---

## 1. Cabeçalho de proveniência

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `fase-4-design-system`
- **phase_title**: Aplicação do design system
- **promoted_at**: 2026-05-16
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`
- **agents_rule_areas**: nenhuma (a fase NÃO toca APIs do Next.js)
- **historical_refs**:
  - `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\design-system`

### Critérios de aceite herdados (EARS)

Os EARS abaixo foram copiados literalmente do `Requirement 5` do master spec (`requirements.md`). Eles definem o resultado esperado desta fase; novos requisitos podem **detalhar** as superfícies tocadas, mas não podem contradizer ou ampliar o escopo declarado aqui — o que extrapolar volta ao master via `OutOfScopeFinding` (§3).

- **Requirement 5.1** — `THE Phase_4_Spec SHALL completar o conjunto de tokens semânticos para warning, danger e blue, incluindo variantes de opacidade documentadas.`
- **Requirement 5.2** — `THE Phase_4_Spec SHALL eliminar cores hexadecimais e tamanhos tipográficos hardcoded em src/components/** e src/app/**, substituindo-os por tokens/classes utilitárias.`
- **Requirement 5.3** — `THE Phase_4_Spec SHALL entregar primitivos faltantes mínimos (Dropdown e focus trap reutilizável) com API consistente com Modal e Switch existentes antes da entrega; primitivos sem essa consistência não são aceitos como concluídos.`
- **Requirement 5.4** — `THE Phase_4_Spec SHALL definir um lint ou checklist que detecte regressões (cor hex literal, tamanho de fonte arbitrário) em PRs.`
- **Requirement 5.5** — `THE Phase_4_Spec SHALL identificar proativamente componentes com lógica equivalente em src/components/** e src/app/** (ex.: implementações de Switch, fluxos de upload, modais/overlays) e consolidá-los em primitivas ou hooks únicos, mesmo quando ainda não foram tratados como duplicação explícita.`
- **Requirement 5.6** — `THE Phase_4_Spec SHALL declarar fora de escopo: redesign visual e introdução de bibliotecas externas de UI (Radix, shadcn etc.).`

---

## 2. Revalidação

### 2.1 `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\design-system`

- **archived_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\design-system`
- **scope**: `design-system`

#### Inventário baseline (evidência usada na classificação)

Comandos rodados em `c:\Users\edulanzarin\Documents\Dev\privello\` antes da redação deste documento. Os números abaixo alimentam as classificações dos itens herdados.

- **Hex literais** (regex `#[0-9a-fA-F]{3,8}\b` em `src/**/*.{tsx,ts,css}`): **216 ocorrências**.
  - Top-N por arquivo: `src/lib/email-templates.ts` (23 — escopo de email HTML, fora desta fase), `src/app/globals.css` (20 — definições legítimas de tokens, esperado), `src/app/cadastro/sucesso/page.tsx` (15), `src/app/p/[slug]/page.tsx` (11), `src/app/painel/page.tsx` (11), `src/components/admin/admin-charts.tsx` (9), `src/app/buscar/page.tsx` (5), `src/components/profile/profile-card.tsx` (5).
  - Hex literais "alvo" (em JSX/TSX de `src/components/**` e `src/app/**`, excluindo `email-templates.ts` e definições de token em `globals.css`): **≈173 ocorrências**.
- **Tamanhos tipográficos arbitrários** (regex `text-\[\d+(\.\d+)?(px|rem|em)\]` em `src/**/*.{tsx,ts}`): **677 ocorrências**.
  - Top-N: `src/app/p/[slug]/page.tsx` (38), `src/app/painel/page.tsx` (34), `src/app/descobrir/[citySlug]/page.tsx` (34), `src/app/conta/verificacao/page.tsx` (30), `src/app/solicitar/[slug]/page.tsx` (29), `src/app/painel/perfil/perfil-editor.tsx` (20), `src/app/painel/midias/midias-manager.tsx` (19), `src/components/reels/reels-feed.tsx` (19), `src/components/painel/reels-manager.tsx` (17), `src/app/admin/midias/page.tsx` (17).
- **Primitivos existentes em `src/components/ui/`**: `avatar`, `badge`, `button`, `card`, `input`, `modal`, `select`, `stat-card`, `switch`, `textarea`, `toast`, `toggle-chip`. **Faltam: `dropdown` e focus trap reutilizável** (não há `use-focus-trap` em `src/lib/hooks/`).
- **Hooks existentes em `src/lib/hooks/`**: `use-escape-key`, `use-file-upload`, `use-media-actions`, `use-scroll-lock`. **Falta: `use-focus-trap`**.
- **Switch duplicado**: além do primitivo `src/components/ui/switch.tsx`, há **5 implementações inline** com mesmo padrão visual (`bg-[#30d158]` quando on / `bg-black/[0.09]` quando off):
  - `src/app/painel/valores/valores-form.tsx:96-99`
  - `src/app/painel/midias/midias-manager.tsx:368-371`
  - `src/app/painel/disponibilidade/availability-form.tsx:81-85`
  - `src/components/painel/reels-manager.tsx:248-252`
  - `src/app/cadastro/acompanhante/provider-register-form.tsx:455-459` (variante usando `bg-success` / `bg-line` — mais próxima do token mas ainda inline)
  - `src/app/conta/onboarding/valores/valores-form.tsx:119-123` (variante usando `bg-coral` / `bg-line`)
- **Modais/overlays inline** (padrão `fixed inset-0 z-…` + backdrop sem usar primitivo `Modal`): **6 ocorrências** em superfícies de produto:
  - `src/app/painel/midias/midias-manager.tsx:397` (lightbox full-screen)
  - `src/app/conta/perfil/client-profile-edit.tsx:60` (modal de edição)
  - `src/components/stories/story-bar.tsx:238` (story viewer)
  - `src/components/profile/profile-story-cover.tsx:205` (story viewer espelhado)
  - `src/components/profile/media-gallery.tsx:178` (galeria full-screen com behavior responsivo)
  - `src/components/admin/warning-form.tsx:93` (modal admin)
  - (`src/components/painel/painel-sidebar.tsx:225` é um drawer de navegação mobile — caso à parte, decisão consciente sobre consolidar ou manter)
- **Uploads via `/api/upload` que NÃO usam `useFileUpload`**: o hook `src/lib/hooks/use-file-upload.ts` já existe (entregue como parte da consolidação inicial), mas tem **zero consumidores**. Todos os 6 sites de upload chamam `fetch("/api/upload", …)` direto:
  - `src/components/painel/media-manager.tsx:126`
  - `src/components/painel/reels-manager.tsx:52` (XHR para progresso real)
  - `src/app/painel/perfil/perfil-editor.tsx:128` + `:144` (também usa `/api/upload-audio`)
  - `src/app/painel/midias/midias-manager.tsx:128`
  - `src/app/painel/stories/stories-manager.tsx:63`
  - `src/app/conta/onboarding/fotos/photo-uploader.tsx:33`
  - `src/app/conta/verificacao/page.tsx:138` (rota distinta `/api/upload/verification`)

Classificação dos Requirements herdados:

#### Itens herdados

- **Item**: Tokens semânticos completos para `warning`, `danger`, `blue` + opacity variants (4%, 6%, 10%, 12%, 20%)
- **Origem no spec arquivado**: `requirements.md > Requirement 1`
- **Estado**: `Confirmado`
- **evidence**: `src/app/globals.css:1-22` declara apenas `--privello-cream`, `--privello-ink`, `--privello-muted`, `--privello-line`, `--privello-coral`, `--privello-green`, `--privello-sidebar`, `--privello-blue` em `:root`, e expõe via `@theme inline` somente background/foreground/muted/line/coral/success/sidebar — **sem `warning`, sem `danger`, sem `blue`, sem opacity variants**. Hex literais como `#0a84ff`, `#ff3b30`, `#ff9500`, `#30d158` aparecem repetidos em `src/app/entrar/page.tsx`, `src/app/painel/plano/upgrade-button.tsx`, `src/app/painel/suporte/**` etc.
- **Tarefa derivada**: completar tokens em `globals.css` e `@theme inline` (Requirement 1 deste spec-filho).

- **Item**: Eliminar cores hexadecimais e tamanhos tipográficos hardcoded em `src/components/**` e `src/app/**`
- **Origem no spec arquivado**: `requirements.md > Requirement 1.5` + `Requirement 2.5` (font-bold ↔ font-semibold)
- **Estado**: `Confirmado`
- **evidence**: 173 hex literais em código de produto (count do inventário) + 677 ocorrências de `text-[Npx]` arbitrários (top file 38). Exemplos concretos: `src/app/painel/plano/upgrade-button.tsx:18` (4 hex `#0a84ff`), `src/app/painel/page.tsx:11`, `src/app/painel/suporte/page.tsx:16-17` (mapeamento de status com `bg-[#0a84ff]/10`).
- **Tarefa derivada**: substituição sistemática por tokens/classes utilitárias (Requirement 2 deste spec-filho).

- **Item**: Primitivo Dropdown
- **Origem no spec arquivado**: `requirements.md > Requirement 12`
- **Estado**: `Confirmado`
- **evidence**: `src/components/ui/` não tem `dropdown.tsx` (listagem confirmada). Não há compound component `Dropdown` + `DropdownTrigger` + `DropdownContent` + `DropdownItem` no projeto.
- **Tarefa derivada**: criar `src/components/ui/dropdown.tsx` com API consistente com Modal/Switch (Requirement 3 deste spec-filho).

- **Item**: Focus trap reutilizável
- **Origem no spec arquivado**: `requirements.md > Requirement 10.5`, `Requirement 10.6`, `Requirement 15.6`
- **Estado**: `Confirmado`
- **evidence**: `src/lib/hooks/` lista `use-escape-key`, `use-file-upload`, `use-media-actions`, `use-scroll-lock` — sem `use-focus-trap`. `src/components/ui/modal.tsx` consome `useScrollLock` e `useEscapeKey` mas NÃO traveja foco; abrir Modal e dar `Tab` permite alcançar elementos atrás do backdrop.
- **Tarefa derivada**: criar `src/lib/hooks/use-focus-trap.ts` (ou componente `<FocusTrap>`) e integrar no Modal (Requirement 4 deste spec-filho).

- **Item**: Lint anti-regressão (cor hex literal e font-size arbitrário)
- **Origem no spec arquivado**: `requirements.md > Requirement 1.5` + `design.md > Testing Strategy > Static Analysis`
- **Estado**: `Confirmado`
- **evidence**: `eslint.config.mjs` na raiz não tem regra de proibição de hex literal nem de `text-[…]` arbitrário (verificar abrindo o arquivo durante a tarefa do spec-filho — não há regra do tipo `no-restricted-syntax` cobrindo `Literal[value=/#[0-9a-f]{3,8}/i]`). Sem template de PR ativo no repositório (`.github/PULL_REQUEST_TEMPLATE.md` ausente).
- **Tarefa derivada**: implementar uma das três opções (eslint custom rule, stylelint, ou checklist humano em template de PR) — Requirement 6 deste spec-filho.

- **Item**: Consolidação de Switch duplicado
- **Origem no spec arquivado**: `requirements.md > Requirement 18.1`
- **Estado**: `Confirmado`
- **evidence**: 5 implementações inline catalogadas no inventário acima (`valores-form`, `midias-manager`, `availability-form`, `reels-manager` painel, `provider-register-form`, `onboarding/valores/valores-form`). Todas reproduzem o mesmo padrão visual mas hardcoded.
- **Tarefa derivada**: substituir cada implementação pelo primitivo `Switch` (Requirement 7 deste spec-filho).

- **Item**: Consolidação de modais/overlays duplicados
- **Origem no spec arquivado**: `requirements.md > Requirement 18.2`
- **Estado**: `Confirmado`
- **evidence**: 6 modais/overlays inline em `painel/midias`, `conta/perfil`, `stories/story-bar`, `profile/profile-story-cover`, `profile/media-gallery`, `admin/warning-form` (paths e linhas no inventário acima).
- **Tarefa derivada**: substituir por `Modal` primitivo onde a semântica permitir; onde não permitir (lightbox full-screen com gestos), abstrair em primitivo derivado `<Lightbox>` ou registrar como `OutOfScopeFinding` (Requirement 8 deste spec-filho).

- **Item**: Consolidação de fluxo de upload duplicado
- **Origem no spec arquivado**: `requirements.md > Requirement 18.4`
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `WHEN a duplicated pattern is identified, THE Design_System SHALL document the canonical component to use as replacement.`
- **Alvo atual**: o hook `src/lib/hooks/use-file-upload.ts` existe e é canônico, mas tem zero consumidores. O reescopo é "migrar 6 sites de upload (5× `fetch("/api/upload")`, 1× XHR com progresso, 1× `/api/upload/verification`) para o hook canônico OU expandir o hook se a API atual não cobrir progresso real (XHR)".
- **evidence**: `src/lib/hooks/use-file-upload.ts:25` (export `useFileUpload`) com zero matches em consumo (apenas `index.ts:1` reexporta). Sites listados no inventário acima.
- **Tarefa derivada**: migrar consumidores e expandir API se necessário (Requirement 9 deste spec-filho).
- **Impacto no master spec**: nenhum — o master Phase Card já fala em "fluxos de upload" no `inputs`/`outputs`.

- **Item**: Componente Dropdown como compound (`Dropdown` + `DropdownTrigger` + `DropdownContent` + `DropdownItem`)
- **Origem no spec arquivado**: `requirements.md > Requirement 12.1` + `design.md > Components and Interfaces > Dropdown Component`
- **Estado**: `Confirmado` (mesmo item já listado acima como "Primitivo Dropdown"; relistado aqui por completude da revalidação requirement-a-requirement)
- **Tarefa derivada**: ver Requirement 3.

- **Item**: Componentes Button, Input, Textarea, Select, Card, Modal, Badge, Avatar, Toast, Switch, ToggleChip já existem e atendem o spec arquivado
- **Origem no spec arquivado**: `requirements.md > Requirements 7, 8, 9, 10, 11, 13, 14, 18.5`
- **Estado**: `Resolvido`
- **evidence**: `src/components/ui/` lista todos os 11 primitivos (paths conferidos). API e variantes correspondem ao spec arquivado.
- **Observação**: NÃO viram tarefa desta fase. Refactor estético/visual deles fora desta fase (Non-Goal). Esta fase pode ajustá-los **só** quando a consolidação 5.5 exigir tornar API consistente com Dropdown (ex.: padronizar nome de prop `open`/`onOpenChange`).

- **Item**: Acessibilidade WCAG AA cross-component (focus rings, aria-label em ícones, contraste 4.5:1, keyboard nav)
- **Origem no spec arquivado**: `requirements.md > Requirement 15`
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `THE Component_Library SHALL ensure all interactive elements have visible focus indicators using the blue focus ring pattern (3px, 25% opacity)`
- **Alvo atual**: a fase 4 só cobre o que decorre dos primitivos novos (Dropdown, focus trap) — auditoria WCAG ampla é fora de escopo (Non-Goal explícito do master `Requirement 5`/`Requirement 6` e do master `requirements.md > §5 Requirement 6.7`). Acessibilidade ampla (audit + assistive tech) entra em fase futura ou Fase 6 quando ligada a mobile/screen reader.
- **evidence**: master `requirements.md > Requirement 6.7` declara WCAG amplo fora de escopo da Fase 5; consequentemente também não é da Fase 4.
- **Tarefa derivada**: a11y básica no Dropdown e no focus trap (`aria-haspopup`, `aria-expanded`, foco cíclico, ESC) — Requirement 3 + 4 deste spec-filho.

- **Item**: Responsividade — breakpoints, page padding, Modal bottom-sheet em mobile, grid adaptativa
- **Origem no spec arquivado**: `requirements.md > Requirement 16`
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `WHEN a Modal is rendered on mobile viewport (< sm), THE Component_Library SHALL use the bottom position variant as a sheet`
- **Alvo atual**: `Modal` primitivo já tem `position: "center" | "bottom" | "fullscreen"`; aplicar bottom-sheet em mobile cabe à Fase 6 (mobile/cross-browser). Esta fase **mantém** `position` como prop e não impõe regra responsiva.
- **evidence**: `src/components/ui/modal.tsx:14` declara `position?: "center" | "bottom" | "fullscreen"`. Master `Requirement 7` (Fase 6) cobre bottom-sheets explicitamente.
- **Observação**: NÃO vira tarefa desta fase. Reaparece em fase-6.

- **Item**: Documentação do design system (tokens + componentes + macOS_Aesthetic)
- **Origem no spec arquivado**: `requirements.md > Requirement 17`
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `THE Design_System SHALL provide a documentation file listing all design tokens with their values and usage guidelines.`
- **Alvo atual**: a Fase 4 entrega `tokens.md` no diretório do spec-filho cobrindo as variantes de opacidade e os primitivos novos (Dropdown, focus trap). Documentação ampla de cada componente já existente fica fora — entra junto da Fase 7 (DX/Infra) se sobrar banda, ou em spec próprio futuro.
- **Tarefa derivada**: produzir `tokens.md` com a tabela de variantes de opacidade (Requirement 1.5 deste spec-filho).

- **Item**: Animações/keyframes padronizados (`fade-in`, `scale-in`, `slide-in`)
- **Origem no spec arquivado**: `requirements.md > Requirement 6`
- **Estado**: `Resolvido`
- **evidence**: `src/app/globals.css:84-128` define `@keyframes fade-in`, `@keyframes scale-in` e classes `animate-fade-in`/`animate-scale-in` com easing `cubic-bezier(0.16, 1, 0.3, 1)`. `slide-in` ainda não existe — se for necessário para Toast/Dropdown, vira sub-task pontual junto do primitivo correspondente.
- **Observação**: a Fase 4 NÃO faz refactor desses keyframes nem renomeia.

---

## 3. Achados fora de escopo

> Nenhum achado fora de escopo registrado nesta fase.

Cada novo achado relevante que extrapolar o escopo desta fase será registrado como uma linha desta tabela (schema `OutOfScopeFinding` de `design.md > Data Models` do master) e disparará commit no master spec, **nunca** absorção silenciosa pelo spec-filho (regra dura E4 de `design.md > Error Handling` do master).

| discoveredIn | description | proposedTarget | evidence |
|---|---|---|---|
| _(vazio até a primeira descoberta)_ | | | |

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

> n/a — fase não toca APIs do Next.js.

A Fase 4 toca exclusivamente: `src/app/globals.css` (tokens), `src/components/ui/**` (primitivos), `src/components/**` e `src/app/**` (substituição de literais), `src/lib/hooks/**` (focus trap), `eslint.config.mjs` ou template de PR (lint anti-regressão). Nenhuma dessas superfícies envolve routing, server actions, middleware, cache, transitions, image config nem headers. Se durante a execução algo exigir tocar API do Next, isso vira `OutOfScopeFinding` (§3), não absorção.

---

## Glossary

- **Phase_4_Spec**: este documento e os artefatos produzidos sob `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\`.
- **Semantic_Tokens**: variáveis CSS em `src/app/globals.css > :root` expostas via `@theme inline` do Tailwind v4. Foco desta fase: completar `warning`, `danger`, `blue` com opacity variants 4%/6%/10%/12%/20%.
- **Hex_Literal**: ocorrência de string `#[0-9a-fA-F]{3,8}` em arquivos `*.tsx`/`*.ts`/`*.css` de `src/components/**` ou `src/app/**`. Exclui `src/app/globals.css > :root` (definições legítimas de token) e `src/lib/email-templates.ts` (HTML de email, fora desta fase).
- **Font_Size_Arbitrary**: classe Tailwind no padrão `text-[Npx]`, `text-[Nrem]` ou `text-[Nem]` com valor entre colchetes em código de produto. Substituível por `text-xs|sm|base|md|lg|xl|2xl|3xl|4xl` quando a escala existente cobre.
- **Primitive_Dropdown**: compound component a ser entregue em `src/components/ui/dropdown.tsx`, com `Dropdown`, `DropdownTrigger`, `DropdownContent`, `DropdownItem`. API consistente com Modal: prop `open` ou estado interno opcional via `defaultOpen`, callback `onOpenChange`, fechamento por outside click + Escape.
- **Focus_Trap**: hook `useFocusTrap(ref, active)` em `src/lib/hooks/use-focus-trap.ts` ou componente `<FocusTrap>` em `src/components/ui/focus-trap.tsx`. Retém ciclo Tab/Shift+Tab dentro de um container e devolve foco ao trigger original quando desativado.
- **Modal_Primitive**: `src/components/ui/modal.tsx`, já existente. Esta fase integra `useFocusTrap` no Modal para fechar a lacuna de a11y.
- **Switch_Primitive**: `src/components/ui/switch.tsx`, já existente. Esta fase substitui as 5 implementações inline pelo primitivo.
- **Lint_Anti_Regression**: mecanismo (eslint custom rule, stylelint OU checklist humano em template de PR) que impede a entrada de novos `Hex_Literal` ou `Font_Size_Arbitrary` em PRs. Decisão entre as três opções é registrada em `design.md`.
- **Token_Migration_Wave**: agrupamento de arquivos para substituir literais em ondas, ordenado por densidade decrescente (top-N do inventário primeiro).

---

## 6. Non-Goals / Out of Scope

Os itens abaixo NÃO fazem parte desta fase e não devem virar tarefa:

1. **Redesign visual amplo** (cores diferentes, layouts novos, mudança de identidade). Esta fase aplica o design system existente sem mudar a paleta nem a hierarquia.
2. **Introdução de bibliotecas externas de UI** (Radix, shadcn, Headless UI, Material UI, Mantine, Chakra etc.). O Dropdown e o focus trap nascem da própria base do projeto.
3. **Mudanças em Modal e Switch existentes** além de uniformizar API (ex.: alinhar nome de prop `open`/`onOpenChange` com o Dropdown novo, integrar `useFocusTrap` no Modal). Refactor visual ou de comportamento desses primitivos é out-of-scope.
4. **Auditoria WCAG ampla** (testes com leitores de tela, validação manual completa, conformidade AAA). Acessibilidade básica (focus visible, ARIA correto, keyboard nav) é exigida para o Dropdown/focus trap; auditoria ampla é fase futura ou parte da Fase 6.
5. **Refactor visual de `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Avatar`, `Toast`, `ToggleChip`** quando puramente estético. Eles entram nesta fase só quando a consolidação 5.5 exige uniformizar API.
6. **Bottom-sheet responsivo no Modal**. O `Modal` já expõe `position="bottom"`; aplicar isso por `useMediaQuery` é Fase 6.
7. **Documentação ampla do design system** (uma página por componente, exemplos navegáveis, Storybook). Esta fase produz `tokens.md` no diretório do spec-filho cobrindo variantes de opacidade. Doc ampla volta para Fase 7 ou spec próprio.
8. **Snapshot/visual regression tests**. Pertencem à Fase 6 (cross-browser).
9. **Refactor de `src/lib/email-templates.ts`** (23 hex literais para HTML de email). Email tem regras próprias de compatibilidade com clientes; trocar hex por tokens CSS quebra na maioria dos clientes (Outlook, Gmail). Fora desta fase.
10. **Mudanças em APIs do Next.js** (routing, server actions, middleware, cache, transitions, image config, headers). A fase é puramente client-side/CSS. Qualquer toque em API do Next vira `OutOfScopeFinding`.
11. **Implementação completa de testes para componentes existentes** que esta fase não toca. Testes determinísticos cobrem o Dropdown e o focus trap; o resto fica para fases futuras.

Qualquer item que apareça nesta lista mas se mostre necessário durante a execução vira `OutOfScopeFinding` (§3) e exige commit no master spec antes de ser absorvido.

---

## Requirements

> Os requisitos abaixo são os EARS herdados (Requirement 5.1–5.6 do master) **destrinchados** por superfície tocada. Cada bloco identifica os arquivos envolvidos, mantém o EARS herdado como referência e adiciona EARS de detalhe que serão validados pelo spec-filho.

### Requirement 1: Tokens semânticos completos (warning, danger, blue + opacity variants)

**User Story:** Como dev, quero tokens semânticos completos com opacity variants padronizadas, para que cores de status (warning, danger) e link/info (blue) sejam consumidas via classe Tailwind e nunca via hex literal.

**Inputs:** `src/app/globals.css`, `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\tokens.md` (novo).

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL completar o conjunto de tokens semânticos para `warning`, `danger` e `blue`, incluindo variantes de opacidade documentadas. _(EARS herdada — Requirement 5.1 do master.)_
2. THE Phase_4_Spec SHALL adicionar em `src/app/globals.css > :root` as três variáveis-base que faltam: `--privello-warning` (alvo: `#ff9500` ou OKLCH equivalente — valor exato decidido em `design.md`), `--privello-danger` (alvo: `#ff3b30` ou equivalente) e expandir `--privello-blue` (já existe como `#0a84ff`).
3. THE Phase_4_Spec SHALL expor em `@theme inline` os tokens semânticos `--color-warning`, `--color-danger` e `--color-blue` mapeados para as variáveis CSS acima, gerando classes utilitárias `bg-warning`, `text-warning`, `border-warning`, `bg-danger`, `text-danger`, `border-danger`, `bg-blue`, `text-blue`, `border-blue`.
4. WHEN um componente referencia uma variante de opacidade dos tokens `coral`, `success`, `warning`, `danger`, `blue`, THE Phase_4_Spec SHALL aceitar a forma `bg-<token>/<NN>` onde `NN ∈ {4, 6, 10, 12, 20}` — sem exigir definições explícitas adicionais em `globals.css` (Tailwind v4 gera as opacidades a partir do token base via syntax `<token>/<percent>`).
5. THE Phase_4_Spec SHALL produzir `tokens.md` em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\` documentando: (a) lista de tokens semânticos com valor base e finalidade; (b) tabela de variantes de opacidade (4%, 6%, 10%, 12%, 20%) por token, com pelo menos um caso de uso real referenciado por `path:linha` para cada variante adotada; (c) regra de quando usar cada token (ex.: `warning` para advertência reversível; `danger` para destrutivo/erro; `blue` para link/info).
6. WHERE Tailwind v4 já cobrir uma variante de opacidade via syntax `<token>/<percent>`, THE Phase_4_Spec SHALL NOT criar variável CSS adicional para a variante (ex.: NÃO definir `--color-warning-12` separado se `bg-warning/12` já gera).
7. THE Phase_4_Spec SHALL preservar todos os tokens existentes em `globals.css` (`background`, `foreground`, `muted`, `line`, `coral`, `success`, `sidebar`) sem alteração de valor; renomear ou remover qualquer um deles vira `OutOfScopeFinding`.

### Requirement 2: Eliminação de hex literais e font-size arbitrários

**User Story:** Como dev, quero `bg-warning/10` em vez de `bg-[#ff9500]/[0.05]` e `text-md` em vez de `text-[14px]`, para que cor e tamanho derivem do design system e mudanças globais sejam triviais.

**Inputs:** todos os arquivos `*.tsx`/`*.ts` em `src/components/**` e `src/app/**` que contenham `Hex_Literal` ou `Font_Size_Arbitrary`. Exclui: `src/lib/email-templates.ts`, `src/app/globals.css > :root` e `@theme inline`.

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL eliminar cores hexadecimais e tamanhos tipográficos hardcoded em `src/components/**` e `src/app/**`, substituindo-os por tokens/classes utilitárias. _(EARS herdada — Requirement 5.2 do master.)_
2. THE Phase_4_Spec SHALL reduzir o número de `Hex_Literal` em arquivos do escopo (definição em Glossary) para **zero** ao final da fase, com a exceção registrada explicitamente em `tokens.md` para casos onde o token semântico ainda não cobre (ex.: cores específicas de chart em `src/components/admin/admin-charts.tsx` — se mantidas, declarar a justificativa).
3. THE Phase_4_Spec SHALL reduzir o número de `Font_Size_Arbitrary` em arquivos do escopo para **zero**, mapeando cada `text-[Npx]` para uma das classes da escala (`text-xs|sm|base|md|lg|xl|2xl|3xl|4xl`); WHERE a escala não cobrir o tamanho exato (raro), THE Phase_4_Spec SHALL adicionar entrada nova em `globals.css > @theme inline` declarando o tamanho como token nomeado E registrar em `tokens.md`.
4. THE Phase_4_Spec SHALL executar a substituição em ondas (`Token_Migration_Wave`), priorizando os arquivos top-N do inventário (38, 34, 34, 30, 29 ocorrências de `Font_Size_Arbitrary` e arquivos com 5+ `Hex_Literal`).
5. WHEN um arquivo do escopo é tocado por uma onda, THE Phase_4_Spec SHALL registrar antes/depois do count em commit message ou em `tokens.md > Migration log`.
6. THE Phase_4_Spec SHALL preservar comportamento visual após a substituição — quando o token escolhido não bater exatamente com o hex original (ex.: `#0a84ff` vs `--privello-blue: #0a84ff`), o spec-filho declara a equivalência em `tokens.md > Migration log`. Mudanças visuais aceitáveis dentro de ±1 nível de luminosidade (ex.: arredondamento por OKLCH) são permitidas; mudanças maiores viram `OutOfScopeFinding`.
7. WHERE houver `Font_Size_Arbitrary` que não corresponde a nenhuma classe da escala E nenhuma variante razoável (ex.: `text-[10px]` em badge minúsculo), THE Phase_4_Spec SHALL adicionar entrada na escala em `globals.css > @theme inline` (ex.: `--text-2xs: 10px`) E aplicar.

### Requirement 3: Primitivo Dropdown

**User Story:** Como dev, quero um Dropdown reutilizável com API consistente com Modal/Switch, para parar de criar menus inline ad-hoc e ter foco/keyboard nav corretos por padrão.

**Inputs:** `src/components/ui/dropdown.tsx` (novo), `src/components/ui/modal.tsx` (referência de API), `src/components/ui/switch.tsx` (referência de API).

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL entregar primitivos faltantes mínimos (Dropdown e focus trap reutilizável) com API consistente com `Modal` e `Switch` existentes antes da entrega; primitivos sem essa consistência não são aceitos como concluídos. _(EARS herdada — Requirement 5.3 do master, parte 1/2 — focus trap em Requirement 4 abaixo.)_
2. THE Phase_4_Spec SHALL criar `src/components/ui/dropdown.tsx` exportando o compound: `Dropdown`, `DropdownTrigger`, `DropdownContent`, `DropdownItem`.
3. THE Phase_4_Spec SHALL declarar a API do `Dropdown` como `{ children: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }` — espelhando a forma do Modal (`open`, `onClose`) com a convenção mais expressiva `onOpenChange` (que retro-aplica eventualmente ao Modal — decisão de uniformização opcional, registrada em `design.md`).
4. WHEN o usuário clica fora do `DropdownContent` enquanto aberto, THE Phase_4_Spec SHALL fechar o Dropdown via `onOpenChange(false)` ou estado interno.
5. WHEN o usuário pressiona `Escape` enquanto o Dropdown está aberto, THE Phase_4_Spec SHALL fechar o Dropdown (consumir `useEscapeKey` do mesmo conjunto de hooks usado pelo Modal).
6. THE Phase_4_Spec SHALL implementar keyboard navigation entre `DropdownItem`s com `ArrowDown`/`ArrowUp` (cíclico) e seleção com `Enter`/`Space`.
7. THE Phase_4_Spec SHALL renderizar `DropdownTrigger` com `aria-haspopup="menu"` e `aria-expanded` refletindo o estado, e `DropdownContent` com `role="menu"`; cada `DropdownItem` com `role="menuitem"`.
8. THE Phase_4_Spec SHALL suportar variantes de `DropdownItem`: `default`, `danger` (texto vermelho via `text-danger`), `disabled` (muted + sem pointer events).
9. THE Phase_4_Spec SHALL suportar prop `align: "start" | "center" | "end"` em `DropdownContent` controlando alinhamento horizontal relativo ao trigger.
10. THE Phase_4_Spec SHALL aplicar tokens semânticos no styling (`shadow-lg`, `rounded-xl`, `bg-background`, `border-line`) — **zero** `Hex_Literal` no arquivo.

### Requirement 4: Focus trap reutilizável

**User Story:** Como dev, quero um focus trap reutilizável que possa ser plugado em qualquer container modal, para garantir que Tab/Shift+Tab cicle dentro do overlay e que o foco volte ao trigger original ao fechar.

**Inputs:** `src/lib/hooks/use-focus-trap.ts` (novo) ou `src/components/ui/focus-trap.tsx` (alternativa); `src/components/ui/modal.tsx` (consumidor).

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL entregar primitivos faltantes mínimos (Dropdown e focus trap reutilizável) com API consistente com `Modal` e `Switch` existentes antes da entrega; primitivos sem essa consistência não são aceitos como concluídos. _(EARS herdada — Requirement 5.3 do master, parte 2/2.)_
2. THE Phase_4_Spec SHALL decidir entre as duas formas de implementação válidas (hook `useFocusTrap` OU componente `<FocusTrap>`) e declarar a escolha em `design.md > Components and Interfaces > Focus Trap`. A decisão é única e final — não entregar as duas.
3. THE Phase_4_Spec SHALL identificar o conjunto de elementos focáveis no container (button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])) e ciclar entre eles com Tab e Shift+Tab.
4. WHEN o focus trap é ativado, THE Phase_4_Spec SHALL mover foco para o primeiro elemento focável (ou para o elemento marcado com `data-autofocus`, se presente).
5. WHEN o focus trap é desativado, THE Phase_4_Spec SHALL devolver foco ao elemento que tinha foco antes da ativação.
6. WHEN o usuário pressiona `Tab` no último elemento focável, THE Phase_4_Spec SHALL mover foco para o primeiro (ciclo).
7. WHEN o usuário pressiona `Shift+Tab` no primeiro elemento focável, THE Phase_4_Spec SHALL mover foco para o último (ciclo reverso).
8. THE Phase_4_Spec SHALL integrar o focus trap no `src/components/ui/modal.tsx` quando `open === true`, sem introduzir breaking change na API pública do Modal (props existentes preservadas).
9. THE Phase_4_Spec SHALL integrar o focus trap no `Dropdown` (Requirement 3) — opcional via prop `trapFocus?: boolean` (default `true` quando `DropdownContent` contém múltiplos `DropdownItem`s; default `false` quando o Dropdown é apenas um menu de seleção rápida sem subnavegação).

### Requirement 5: Eliminação de duplicações (Switch, modais/overlays, upload)

**User Story:** Como dev, quero uma única implementação canônica de cada primitivo/fluxo, para que mudanças globais não exijam tocar 5 arquivos.

**Inputs:** lista de duplicações catalogada em §2 (Revalidação) — 5 switches inline, 6 modais inline, 6 sites de upload sem `useFileUpload`.

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL identificar proativamente componentes com lógica equivalente em `src/components/**` e `src/app/**` (ex.: implementações de Switch, fluxos de upload, modais/overlays) e consolidá-los em primitivas ou hooks únicos, mesmo quando ainda não foram tratados como duplicação explícita. _(EARS herdada — Requirement 5.5 do master.)_
2. THE Phase_4_Spec SHALL substituir as **5** implementações inline de Switch (paths em §2) pelo primitivo `Switch` de `src/components/ui/switch.tsx`. O comportamento (estado, callback, label, disabled) é preservado bit-a-bit.
3. THE Phase_4_Spec SHALL substituir os **6** modais/overlays inline de produto (paths em §2) pelo primitivo `Modal` de `src/components/ui/modal.tsx`, OU declarar caso a caso (em `design.md`) qual modal não pode ser substituído porque o comportamento exigido (gestos full-screen, swipe-to-dismiss, autoplay de mídia) não cabe na API atual do Modal — esses casos viram tarefa de **abstração derivada** (ex.: `<Lightbox>` baseado em Modal) ou `OutOfScopeFinding`.
4. THE Phase_4_Spec SHALL migrar os **6** sites de upload via `/api/upload` para o hook canônico `useFileUpload` (`src/lib/hooks/use-file-upload.ts`) OU expandir a API do hook quando ela não cobrir o uso (XHR com progresso real em `src/components/painel/reels-manager.tsx`). A decisão de expandir vs. manter site específico fora do hook é registrada em `design.md`.
5. THE Phase_4_Spec SHALL preservar comportamento funcional de cada substituição — qualquer divergência (ex.: rate limit aplicado pelo backend, mensagem de erro) é validada em smoke check antes do merge.
6. WHERE `src/components/painel/painel-sidebar.tsx:225` (drawer de navegação mobile) for considerado, THE Phase_4_Spec SHALL decidir entre (a) usar `Modal position="fullscreen"` ou `position="bottom"`, (b) abstrair `<Drawer>` baseado no Modal, ou (c) manter como caso à parte. A decisão entra em `design.md`.

### Requirement 6: Lint anti-regressão

**User Story:** Como dev, quero um mecanismo automático ou um checklist explícito que impeça novos hex literais e novos `text-[Npx]` arbitrários de entrarem em PRs, para que o trabalho desta fase não regrida.

**Inputs:** `eslint.config.mjs` (raiz) OU `.github/PULL_REQUEST_TEMPLATE.md` (novo).

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL definir um lint ou checklist que detecte regressões (cor hex literal, tamanho de fonte arbitrário) em PRs. _(EARS herdada — Requirement 5.4 do master.)_
2. THE Phase_4_Spec SHALL escolher entre as três formas válidas de implementação e declarar a escolha em `design.md > Components and Interfaces > Lint anti-regressão`:
   - **(a)** ESLint custom rule via `no-restricted-syntax` em `eslint.config.mjs` cobrindo: literais de string contendo `#[0-9a-fA-F]{3,8}` em arquivos de `src/components/**` e `src/app/**` (excluindo `src/lib/email-templates.ts` e `src/app/globals.css`); E literais contendo `text-\[\d+(\.\d+)?(px|rem|em)\]`.
   - **(b)** Stylelint com plugin `stylelint-no-hex` (ou equivalente) — apenas se houver CSS adicional onde regra ESLint não chega.
   - **(c)** Checklist humano em `.github/PULL_REQUEST_TEMPLATE.md` — apenas se as opções (a) e (b) forem inviáveis. A escolha por checklist é registrada com justificativa explícita.
3. THE Phase_4_Spec SHALL aceitar como "implementado" o lint ou checklist quando: (a) `npm run lint` falha em um arquivo de teste contendo um hex literal e um `text-[Npx]` recém-introduzido; OU (b) o template de PR exibe o checklist com os dois itens marcáveis.
4. WHEN a opção escolhida é (a) ESLint custom rule, THE Phase_4_Spec SHALL incluir whitelist por arquivo em `eslint.config.mjs > overrides` para `src/lib/email-templates.ts` e para qualquer entrada em `tokens.md > Exceções declaradas`.
5. THE Phase_4_Spec SHALL declarar como contrato com a Fase 7 (DX/Infra): o lint configurado nesta fase é consumido pela CI. Nenhuma alteração na CI mora aqui — apenas a regra está executável via `npm run lint`.

### Requirement 7: Itens fora de escopo declarados

**User Story:** Como mantenedor, quero que itens fora de escopo apareçam explicitamente, para que ninguém os absorva por engano.

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL declarar fora de escopo: redesign visual e introdução de bibliotecas externas de UI (Radix, shadcn etc.). _(EARS herdada — Requirement 5.6 do master.)_
2. WHEN um item da seção "Non-Goals" deste documento aparecer durante a execução, THE Phase_4_Spec SHALL registrá-lo como `OutOfScopeFinding` na §3 deste documento e abrir commit no master spec antes de qualquer absorção.

### Requirement 8: Testes do Dropdown e do focus trap

**User Story:** Como dev, quero testes determinísticos e property-based para os primitivos novos, para que regressões sobre Dropdown/focus trap sejam detectadas na CI.

**Inputs:** infraestrutura de testes da Fase 2 (Vitest + fast-check em `vitest.config.ts`); arquivos `*.test.ts` co-localizados.

#### Acceptance Criteria

1. THE Phase_4_Spec SHALL entregar pelo menos um arquivo `.test.ts` co-localizado para cada primitivo novo (`src/components/ui/dropdown.test.ts`, e teste do focus trap — co-localizado com a forma escolhida em Requirement 4.2).
2. THE Phase_4_Spec SHALL cobrir nos testes determinísticos: outside click fecha Dropdown; Escape fecha Dropdown; arrow keys navegam entre `DropdownItem`s; ARIA attributes presentes e corretos.
3. THE Phase_4_Spec SHALL entregar pelo menos um arquivo `.pbt.ts` co-localizado com cada primitivo novo cobrindo as Correctness Properties declaradas em `design.md > Correctness Properties`.
4. THE Phase_4_Spec SHALL executar `npm run test` localmente e anexar log da execução (zero falhas) como evidência da Tarefa de Saída.
5. THE Phase_4_Spec SHALL declarar fora de escopo testes para os primitivos pré-existentes (Modal, Switch, Button, etc.) — exceto quando a integração do focus trap no Modal exigir teste novo cobrindo o ciclo Tab.

---

## Saída desta fase

A Fase 4 é considerada `Done` quando:

- Todos os 8 Requirements desta seção têm seus EARS verificáveis e há evidência (path:linha de código, log de teste, ou link de PR) anexada para cada um.
- `tokens.md` existe em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\` cobrindo: lista de tokens semânticos, tabela de variantes de opacidade documentadas, exceções declaradas (se houver).
- A contagem de `Hex_Literal` e `Font_Size_Arbitrary` em arquivos do escopo (excluindo `globals.css` e `email-templates.ts`) é **zero** OU as exceções estão registradas em `tokens.md > Exceções declaradas` com justificativa.
- O primitivo `Dropdown` existe em `src/components/ui/dropdown.tsx` com API consistente (Requirement 3) e é coberto por testes determinísticos e PBT.
- O focus trap (hook ou componente, decisão única em `design.md`) existe e está integrado no Modal sem breaking change.
- As 5 implementações inline de Switch foram substituídas pelo primitivo `Switch`.
- Os 6 modais/overlays inline foram tratados (substituídos por Modal, abstraídos em primitivo derivado, ou registrados como `OutOfScopeFinding` com justificativa caso-a-caso).
- Os 6 sites de upload via `/api/upload` foram migrados para `useFileUpload` (com expansão da API se necessário).
- Lint anti-regressão (ou checklist humano em PR template) está executável.
- Smoke checks finais passam: `npm run lint` (zero novos erros nos arquivos do escopo), `npx tsc --noEmit` (zero erros), `npm run test` (zero falhas), `npm run build` (sucesso).
- A §3 deste documento (`OutOfScopeFinding`) tem cada linha referenciando um commit no master spec, ou está marcada como vazia.
- O Phase Card desta fase no master `requirements.md` foi atualizado para `state: Done` com `doneAt` ISO-8601 e link para esta pasta (esta tarefa final é executada pelo orquestrador, não pelo redator/executor).

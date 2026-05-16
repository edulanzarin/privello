# Implementation Plan: `fase-4-design-system`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas completam tokens semânticos, eliminam literais hardcoded em ondas, entregam primitivos faltantes (`Dropdown` e focus trap), consolidam duplicações catalogadas no inventário (5 switches inline, 6 modais inline, 6 sites de upload sem hook canônico) e instalam lint anti-regressão.

Restrições importantes:

- **Sem alterações em APIs do Next.js.** A fase NÃO toca routing, server actions, middleware, cache, transitions, image config nem headers. Se algo exigir, vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master spec.
- **Sem novas bibliotecas externas.** Dropdown e focus trap são escritos do zero. Se Radix/shadcn etc. for tentado, vira `OutOfScopeFinding`.
- **Sem refactor visual** dos primitivos pré-existentes (Modal, Switch, Button, Input, Textarea, Select, Card, Badge, Avatar, Toast, ToggleChip) além do necessário para integrar focus trap no Modal e uniformizar API se a consolidação 5.5 exigir.
- **Sem auditoria WCAG ampla.** A11y básica do Dropdown (`aria-haspopup`, `aria-expanded`, `role="menu"`, keyboard nav) é exigida; auditoria ampla é Fase 6 ou spec próprio.
- **Idioma pt-BR** em todos os documentos do spec-filho.

Tarefas marcadas com `*` produzem property tests (validam Properties em `design.md > Correctness Properties`).

## Tasks

- [x] 1. Inventário baseline (registro)
  - [x] 1.1 Registrar contagem de hex literais e font-size arbitrário no spec-filho
    - Confirmar números do inventário rodado pelo redator: **216 hex literais totais**, **≈173 em código de produto** (excluindo `email-templates.ts` e `globals.css`); **677 ocorrências de `text-[Npx]` arbitrário**
    - Anexar tabela top-N por arquivo em `inventario-baseline.md` (novo, opcional) ou em `tokens.md > Migration baseline`
    - Listar paths exatos das 5 implementações inline de Switch, dos 6 modais inline e dos 6 sites de upload sem `useFileUpload`
    - _Requirements: 2.4, 5.5_

- [x] 2. Tokens semânticos completos
  - [x] 2.1 Adicionar `--privello-warning` e `--privello-danger` em `globals.css > :root`
    - `--privello-warning: #ff9500`
    - `--privello-danger: #ff3b30`
    - Preservar todos os tokens existentes (`--privello-cream`, `--privello-ink`, `--privello-muted`, `--privello-line`, `--privello-coral`, `--privello-green`, `--privello-sidebar`, `--privello-blue`)
    - _Requirements: 5.1, 5.7_

  - [x] 2.2 Mapear `--color-warning`, `--color-danger`, `--color-blue` em `@theme inline`
    - Adicionar entradas `--color-warning: var(--privello-warning)`, `--color-danger: var(--privello-danger)`, `--color-blue: var(--privello-blue)` em `@theme inline`
    - Validar que classes utilitárias `bg-warning`, `text-danger`, `border-blue`, `bg-warning/10`, `text-blue/[0.04]` etc. funcionam (Tailwind v4 gera opacidades via syntax `<token>/<percent>`)
    - _Requirements: 5.1, 5.3_

  - [x] 2.3 Declarar escala tipográfica explícita em `@theme inline`
    - Adicionar `--text-2xs: 10px`, `--text-xs: 11px`, `--text-sm: 12px`, `--text-base: 13px`, `--text-md: 14px`, `--text-lg: 15px`, `--text-xl: 16px`, `--text-2xl: 18px`, `--text-3xl: 22px`, `--text-4xl: 28px`
    - **Atenção**: `text-sm` deixa de ser 14px (default Tailwind) e passa a ser 12px (alinhado ao spec arquivado §2.1). Esta mudança afeta arquivos que usam `text-sm` hoje contando com 14px — listar e revalidar visualmente caso a caso na Wave 1
    - _Requirements: 5.2, 5.3_

  - [x] 2.4 Validar build após mudanças em `globals.css`
    - `npm run build` deve passar sem warning de token desconhecido
    - `npm run lint` ainda pode falhar nos arquivos não-migrados — não é regressão, é esperado durante a execução das ondas
    - _Requirements: 5.1_

  - [x] 2.5 Produzir `tokens.md` em `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-4-design-system\`
    - Seção "Tokens semânticos": lista com valor base e finalidade (`coral` para brand, `success` para confirmação, `warning` para advertência reversível, `danger` para destrutivo/erro, `blue` para link/info)
    - Seção "Variantes de opacidade": tabela por token mostrando 4%, 6%, 10%, 12%, 20% com ao menos um caso de uso real referenciado por `path:linha` por variante adotada
    - Seção "Escala tipográfica": tabela com `text-2xs` até `text-4xl` mapeada a px
    - Seção "Exceções declaradas": cores fora do design system que permanecem (cores de chart em `admin-charts.tsx` — listar paths se mantidas)
    - Seção "API conventions": divergência consciente Modal (`onClose`) vs Dropdown (`onOpenChange`)
    - Seção "Migration log": antes/depois de count por arquivo conforme as ondas avançam
    - _Requirements: 1.5, 2.5_

- [x] 3. Primitivo Dropdown
  - [x] 3.1 Criar `src/components/ui/dropdown.tsx` com compound component
    - Exportar: `Dropdown`, `DropdownTrigger`, `DropdownContent`, `DropdownItem`
    - API conforme `design.md > Components and Interfaces > 2`: `open?`, `defaultOpen?`, `onOpenChange?`, `align?`, `trapFocus?`, `variant?`
    - Estado: controlado (`open` controlado externamente) ou interno (`defaultOpen`)
    - Estilos com tokens: `bg-background border border-line shadow-lg rounded-xl py-1 min-w-[160px]` no content; `px-3 py-2 text-sm hover:bg-black/[0.04] focus:bg-black/[0.04]` nos items; `text-danger` para variant `danger`; `opacity-40 pointer-events-none` para `disabled`
    - **Zero hex literal** no arquivo
    - _Requirements: 3.2, 3.10_

  - [x] 3.2 Implementar comportamento do Dropdown
    - `DropdownTrigger`: renderiza com `aria-haspopup="menu"`, `aria-expanded={open}`. Suporta `asChild` para clonar o filho.
    - `DropdownContent`: renderiza com `role="menu"`. Listener de outside click no document. Consome `useEscapeKey` para fechar.
    - `DropdownItem`: `<button role="menuitem">`. Variantes `default`/`danger`/`disabled`.
    - Keyboard nav: `ArrowDown`/`ArrowUp` movem foco entre items (cíclico). `Enter`/`Space` ativam item.
    - `align`: `start`/`center`/`end` controla alinhamento horizontal relativo ao trigger via classe utilitária (`left-0`/`left-1/2 -translate-x-1/2`/`right-0`).
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 3.3 Validar consistência de API com Modal/Switch
    - Modal usa `open: boolean` + `onClose: () => void`. Dropdown usa `open?: boolean` + `onOpenChange?: (open: boolean) => void`. Diferença consciente — registrar em `tokens.md > API conventions`.
    - Switch usa `checked: boolean` + `onChange: (checked: boolean) => void`. Mesmo padrão `valor + callback`.
    - Toda prop deve ter tipo TS exportado para que consumidores possam reusar (`DropdownProps`, `DropdownItemProps`, etc.)
    - _Requirements: 3.1, 3.3_

- [x] 4. Focus trap reutilizável
  - [x] 4.1 Criar `src/lib/hooks/use-focus-trap.ts`
    - Decisão registrada em `design.md`: **hook**, não componente
    - Signature: `useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, options?: { autoFocus?: "first" | "data-autofocus" | false })`
    - Implementação: `useEffect` que adiciona `keydown` listener; quando `active` vai para `true`, salva `document.activeElement` e move foco para o primeiro focável (ou `[data-autofocus]`); quando `active` vai para `false`, devolve foco
    - Seletor de focáveis: `'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'` filtrado por `:not(:disabled)`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 4.2 Re-exportar em `src/lib/hooks/index.ts`
    - Adicionar `export { useFocusTrap } from "./use-focus-trap"`
    - Manter exports existentes intactos
    - _Requirements: 4.2_

  - [x] 4.3 Integrar `useFocusTrap` em `src/components/ui/modal.tsx`
    - Adicionar `const contentRef = useRef<HTMLDivElement>(null)` e `useFocusTrap(contentRef, open)`
    - Anexar `ref={contentRef}` ao container interno (`<div className={cn("relative z-10", className)}>`)
    - **Sem breaking change na API pública**: `open`, `onClose`, `children`, `className`, `persistent`, `position` preservados
    - _Requirements: 4.8_

  - [x] 4.4 Integrar `useFocusTrap` no Dropdown (opcional via prop)
    - `DropdownContent` aceita `trapFocus?: boolean` (default: `true` quando há ≥ 2 items, senão `false`)
    - Quando `trapFocus === true`, ativar `useFocusTrap(contentRef, open)`
    - _Requirements: 4.9_

- [x] 5. Eliminação de hex literais e font-size arbitrários — Wave 1 (Font_Size_Arbitrary top-N)
  - [x] 5.1 Migrar `src/app/p/[slug]/page.tsx` (38 ocorrências de `text-[Npx]` + 11 hex literais)
    - Mapear cada `text-[Npx]` para classe da escala (`text-xs`, `text-sm`, `text-base`, `text-md`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`)
    - Substituir hex literais por tokens semânticos (`#0a84ff` → `text-blue` etc.)
    - Validar visualmente (smoke local) que o layout não regrediu
    - Registrar antes/depois em `tokens.md > Migration log`
    - _Requirements: 5.2, 5.3, 5.6_

  - [x] 5.2 Migrar `src/app/painel/page.tsx` (34 + 11)
    - Mesmo mapeamento canônico
    - _Requirements: 5.2, 5.3, 5.6_

  - [x] 5.3 Migrar `src/app/descobrir/[citySlug]/page.tsx` (34 + 3)
    - Mesmo mapeamento canônico
    - _Requirements: 5.2, 5.3, 5.6_

  - [x] 5.4 Migrar `src/app/conta/verificacao/page.tsx` (30 ocorrências de `text-[Npx]`)
    - Mesmo mapeamento canônico
    - _Requirements: 5.2, 5.3_

  - [x] 5.5 Migrar `src/app/solicitar/[slug]/page.tsx` (29 ocorrências)
    - Mesmo mapeamento canônico
    - _Requirements: 5.2, 5.3_

- [x] 6. Eliminação de hex literais — Wave 2 (Hex_Literal top-N)
  - [x] 6.1 Migrar `src/app/cadastro/sucesso/page.tsx` (15 hex literais)
    - Mapeamento canônico (`#0a84ff` → blue, `#ff3b30` → danger, etc.)
    - _Requirements: 5.2, 5.6_

  - [x] 6.2 Migrar `src/components/admin/admin-charts.tsx` (9 hex literais)
    - Cores de chart podem precisar permanecer literais — tomar decisão caso a caso
    - WHERE permanecerem, registrar em `tokens.md > Exceções declaradas` com justificativa "cor específica de visualização de dados, não pertence à paleta semântica"
    - _Requirements: 5.2, 5.7_

  - [x] 6.3 Migrar `src/app/buscar/page.tsx` (5 hex + 15 font-size)
    - Mapeamento canônico
    - _Requirements: 5.2, 5.3_

  - [x] 6.4 Migrar `src/components/profile/profile-card.tsx` (5 hex + 13 font-size)
    - Mapeamento canônico
    - _Requirements: 5.2, 5.3_

  - [x] 6.5 Migrar `src/app/entrar/page.tsx` (4 hex)
    - `#0a84ff` → `text-blue`/`bg-blue`; `#ff3b30` → `text-danger`; `#f5f5f7` → `bg-background`
    - _Requirements: 5.2_

  - [x] 6.6 Migrar `src/app/painel/plano/upgrade-button.tsx` (4 hex)
    - `#0a84ff` em todas as 4 ocorrências → variantes `bg-blue/[0.04]`, `bg-blue/[0.08]`, `text-blue`, `border-blue/40`
    - _Requirements: 5.2_

  - [x] 6.7 Migrar `src/app/painel/plano/page.tsx` (4 hex + 13 font-size)
    - `#ff9500` → `text-warning`/`bg-warning`; `#30d158` → `text-success`; `#b36200` (texto escuro sobre warning) → registrar como exceção em `tokens.md` OU usar `text-warning` se contraste suficiente
    - _Requirements: 5.2, 5.3_

  - [x] 6.8 Migrar `src/app/painel/suporte/page.tsx` e `src/app/painel/suporte/[id]/page.tsx` (4 hex cada, padrão idêntico de status badges)
    - `bg-[#0a84ff]/10 text-[#0a84ff]` → `bg-blue/10 text-blue`
    - `bg-[#ff9500]/10 text-[#b36200]` → `bg-warning/10 text-warning` (validar contraste)
    - _Requirements: 5.2_

- [x] 7. Consolidação de Switch duplicado
  - [x] 7.1 Substituir Switch inline em `src/app/painel/valores/valores-form.tsx:96-99`
    - `<button onClick={...} className="...flex h-[22px] w-[40px]...rounded-full transition-colors duration-200...">` → `<Switch checked={enabled[d.minutes]} onChange={(c) => setEnabled((p) => ({ ...p, [d.minutes]: c }))} disabled={d.required} size="md" />`
    - Validar comportamento idêntico (estado, callback, disabled)
    - _Requirements: 5.2_

  - [x] 7.2 Substituir Switch inline em `src/app/painel/midias/midias-manager.tsx:368-371`
    - Caso especial: estado invertido (`!uploadPublic`). Solução: `<Switch checked={!uploadPublic} onChange={(c) => setUploadPublic(!c)} ... />` OU renomear estado para `isPrivate` (decisão pequena no commit)
    - _Requirements: 5.2_

  - [x] 7.3 Substituir Switch inline em `src/app/painel/disponibilidade/availability-form.tsx:81-85`
    - `<Switch checked={openDays[wd]} onChange={(c) => setOpenDays((prev) => prev.map((p, i) => (i === wd ? c : p)))} size="md" />`
    - _Requirements: 5.2_

  - [x] 7.4 Substituir Switch inline em `src/components/painel/reels-manager.tsx:248-252`
    - Caso especial: estado invertido (`isPrivate`). Manter semântica como em 7.2.
    - _Requirements: 5.2_

  - [x] 7.5 Substituir Switch inline em `src/app/cadastro/acompanhante/provider-register-form.tsx:455-459`
    - Já usa tokens (`bg-success`/`bg-line`); substituir mesmo assim para consolidar API
    - _Requirements: 5.2_

  - [x] 7.6 Decidir caso `src/app/conta/onboarding/valores/valores-form.tsx:119-123`
    - Switch inline usa cor `bg-coral` (não verde do primitivo). Decisão:
      - (a) Substituir aceitando unificação visual no verde do `Switch` primitivo
      - (b) Registrar como `OutOfScopeFinding` ("Switch primitivo não parametriza cor; refactor de API é fora desta fase")
    - Documentar a decisão escolhida em `tokens.md`
    - _Requirements: 5.2, 5.5_

- [x] 8. Consolidação de modais/overlays duplicados
  - [x] 8.1 Substituir modal admin em `src/components/admin/warning-form.tsx:93`
    - Trocar `<div className="fixed inset-0 z-50 ...">` por `<Modal open={open} onClose={() => setOpen(false)} className="w-full max-w-sm bg-white p-6 shadow-xl">`
    - Preservar `role="dialog"`/`aria-modal="true"` (Modal já fornece)
    - _Requirements: 5.2_

  - [x] 8.2 Substituir modal de edição em `src/app/conta/perfil/client-profile-edit.tsx:60`
    - Trocar `<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 ...">` por `<Modal open={open} onClose={() => setOpen(false)} position="center" className="w-full max-w-md ...">`
    - _Requirements: 5.2_

  - [x] 8.3 Substituir lightbox full-screen em `src/app/painel/midias/midias-manager.tsx:397`
    - Trocar `<div className="fixed inset-0 z-[200] flex flex-col bg-black">` por `<Modal open={!!curItem} onClose={...} position="fullscreen" className="bg-black">`
    - Preservar gestos de teclado/touch existentes
    - _Requirements: 5.2_

  - [x] 8.4 Decidir caso de `src/components/stories/story-bar.tsx:238` (story viewer)
    - O viewer tem comportamentos próprios (autoplay, swipe, progresso). Decisão:
      - (a) Abstrair em `<StoryViewer>` interno que envolve `Modal position="fullscreen"`
      - (b) Substituir o overlay por `Modal position="fullscreen"` direto e manter os comportamentos no JSX atual
      - (c) Registrar como `OutOfScopeFinding` se a complexidade exceder esta fase
    - Documentar a decisão em `tokens.md` e implementar
    - _Requirements: 5.2, 5.5_

  - [x] 8.5 Substituir story viewer espelhado em `src/components/profile/profile-story-cover.tsx:205`
    - Aplicar a mesma decisão da 8.4
    - _Requirements: 5.2_

  - [x] 8.6 Decidir caso de `src/components/profile/media-gallery.tsx:178` (galeria responsiva)
    - Behavior responsivo (mobile fullscreen, desktop centered). Decisão preliminar do design: **registrar como `OutOfScopeFinding` para `fase-6-mobile-cross-browser`** (responsividade é tema central da Fase 6)
    - Confirmar e registrar OutOfScopeFinding em `requirements.md > §3` com commit no master
    - _Requirements: 5.2, 5.5, 7.2_

  - [x] 8.7 Avaliar `src/components/painel/painel-sidebar.tsx:225` (drawer mobile)
    - Não é modal — é drawer com transição lateral. Decisão preliminar do design: **manter como caso à parte; refactor para `<Drawer>` é tarefa potencial fora da Fase 4**. Registrar como nota em `tokens.md > Out of scope desta fase`
    - _Requirements: 5.5_

- [x] 9. Consolidação de fluxo de upload duplicado
  - [x] 9.1 Decidir expansão de `useFileUpload` para suportar XHR com progresso
    - Atualmente o hook usa `fetch` (sem progresso real). Para cobrir `src/components/painel/reels-manager.tsx:52` (XHR com `xhr.upload.onprogress`), expandir API
    - Adicionar `strategy?: "fetch" | "xhr"` (default `"fetch"`) e `onProgress?: (percent: number) => void`
    - Implementar branch XHR no hook quando `strategy === "xhr"`
    - _Requirements: 5.4_

  - [x] 9.2 Migrar `src/components/painel/media-manager.tsx:126`
    - `fetch("/api/upload", ...)` → `useFileUpload({ endpoint: "/api/upload", onError: (e) => toast(e, "error") })`
    - _Requirements: 5.4_

  - [x] 9.3 Migrar `src/app/painel/perfil/perfil-editor.tsx:128` e `:144`
    - Caso `:144` é `/api/upload-audio` — endpoint distinto, mesma estrutura
    - `useFileUpload({ endpoint: "/api/upload" })` para `:128`; `useFileUpload({ endpoint: "/api/upload-audio" })` para `:144`
    - _Requirements: 5.4_

  - [x] 9.4 Migrar `src/app/painel/midias/midias-manager.tsx:128`
    - `useFileUpload({ endpoint: "/api/upload" })`
    - _Requirements: 5.4_

  - [x] 9.5 Migrar `src/app/painel/stories/stories-manager.tsx:63`
    - `useFileUpload({ endpoint: "/api/upload" })`
    - _Requirements: 5.4_

  - [x] 9.6 Migrar `src/app/conta/onboarding/fotos/photo-uploader.tsx:33`
    - `useFileUpload({ endpoint: "/api/upload" })`
    - _Requirements: 5.4_

  - [x] 9.7 Migrar `src/components/painel/reels-manager.tsx:52` (XHR com progresso)
    - `useFileUpload({ endpoint: "/api/upload", strategy: "xhr", onProgress: setUploadProgress })`
    - Validar que o progresso continua sendo emitido em tempo real
    - _Requirements: 5.4_

  - [x] 9.8 Migrar `src/app/conta/verificacao/page.tsx:138` (`/api/upload/verification`)
    - `useFileUpload({ endpoint: "/api/upload/verification" })`
    - _Requirements: 5.4_

- [x] 10. Eliminação de hex literais e font-size — Wave restante (cauda)
  - [x] 10.1 Migrar arquivos com 1–4 hex literais e/ou 1–10 ocorrências de `text-[Npx]`
    - Lista derivada do inventário (paths em `inventario-baseline.md` ou `tokens.md > Migration baseline`)
    - Aplicar mapeamento canônico em massa
    - Pode ser quebrada em sub-tarefas por subdiretório (`src/app/painel/`, `src/components/profile/`, `src/components/reels/`, etc.) se conveniente
    - _Requirements: 5.2, 5.3, 5.6_

  - [x] 10.2 Validar contagem final
    - Re-rodar inventário (`grep -r '#[0-9a-fA-F]\{3,8\}' src/components/ src/app/`) e (`grep -rE 'text-\[\d+(\.\d+)?(px|rem|em)\]' src/`)
    - Confirmar contagem **zero** em arquivos do escopo, exceto exceções declaradas em `tokens.md`
    - Anexar log final em `tokens.md > Migration log`
    - _Requirements: 5.2, 5.3, 7.2_

- [ ] 11. Lint anti-regressão
  - [ ] 11.1 Adicionar regra ESLint custom em `eslint.config.mjs`
    - Decisão registrada em `design.md`: opção (a) — ESLint custom rule via `no-restricted-syntax`
    - Adicionar override cobrindo `src/components/**/*.{ts,tsx}` e `src/app/**/*.{ts,tsx}`
    - Selectors: `Literal[value=/#[0-9a-fA-F]{3,8}\b/]` e `Literal[value=/text-\[\d+(\.\d+)?(px|rem|em)\]/]`
    - Mensagens em pt-BR explicando o token alternativo a usar
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 11.2 Configurar overrides para arquivos isentos
    - `src/lib/email-templates.ts` — HTML de email, regra não se aplica
    - Demais arquivos listados em `tokens.md > Exceções declaradas` (ex.: `src/components/admin/admin-charts.tsx` se cores de chart permanecerem)
    - _Requirements: 6.4_

  - [ ] 11.3 Validar a regra
    - Criar arquivo de teste temporário `src/components/_lint-smoke.tsx` (ou usar arquivo já migrado adicionando hex/`text-[Npx]` propositalmente em branch local) e rodar `npm run lint` — deve falhar
    - Remover o arquivo de teste; rodar `npm run lint` novamente — deve passar (assumindo todas as ondas terminadas)
    - Documentar o teste em `tokens.md > Lint anti-regressão`
    - _Requirements: 6.3_

  - [ ] 11.4 Declarar contrato com a CI da Fase 7
    - Em `tokens.md > Contrato com a CI da Fase 7`: o lint configurado nesta fase é consumido pela CI da Fase 7. Esta fase não toca configuração de CI.
    - _Requirements: 6.5_

- [x] 12. Testes determinísticos para Dropdown e focus trap
  - [x] 12.1 Criar `src/components/ui/dropdown.test.ts`
    - Testar: outside click fecha; Escape fecha; ArrowDown/ArrowUp navegam entre items; Enter dispara `onClick` do item ativo
    - ARIA: `aria-haspopup="menu"` no trigger; `aria-expanded` reflete estado; `role="menu"` no content; `role="menuitem"` em items
    - Variantes: `default`/`danger`/`disabled` aplicam classes corretas; `disabled` não dispara `onClick`
    - Estado controlado vs interno: forçar prop `open={true}` mesmo quando internamente seria `false`; validar que estado externo prevalece
    - _Requirements: 8.1, 8.2_

  - [x] 12.2 Criar `src/lib/hooks/use-focus-trap.test.ts`
    - Renderizar componente helper que consome o hook (3-5 botões dentro de container)
    - Testar: ao ativar, foco vai para o primeiro elemento focável; Tab no último cicla para o primeiro; Shift+Tab no primeiro cicla para o último; ao desativar, foco volta ao elemento anterior
    - Testar `data-autofocus`: quando presente, foco vai para esse elemento ao ativar
    - _Requirements: 8.1, 8.2_

  - [x] 12.3 Atualizar/criar smoke test do Modal com focus trap integrado
    - Se `src/components/ui/modal.test.ts` não existir, criar com smoke mínimo
    - Testar: abrir Modal, simular Tab múltiplas vezes, foco não escapa do container
    - _Requirements: 4.8, 8.2_

- [ ] 13. Property tests para Dropdown e focus trap
  - [ ] 13.1 * Implementar `src/lib/hooks/use-focus-trap.pbt.ts` (Property 1, Property 2)
    - Property 1 (completude do ciclo): para todo `n ∈ [2, 10]` e `i ∈ [0, n)`, aplicar n Tabs retorna ao mesmo elemento; aplicar n Shift+Tabs retorna ao mesmo elemento
    - Property 2 (libera foco anterior): para todo elemento externo `e` com foco antes da ativação, desativar leva `document.activeElement === e`
    - Geradores: `fc.integer({ min: 2, max: 10 })` para `n`; container montado com `n` `<button>`s
    - _Requirements: 8.3_
    - _Validates: Property 1, Property 2_

  - [ ] 13.2 * Implementar `src/components/ui/dropdown.pbt.ts` (Property 3)
    - Property 3 (estado controlado vs interno): para todo par `(controlled, defaultOpen, sequenceOfClicks)`, validar que se `controlled === true` o estado externo é fonte de verdade; senão o Dropdown alterna conforme cliques
    - Geradores: `fc.boolean()`, `fc.array(fc.constantFrom("trigger", "outside", "escape"), { maxLength: 5 })`
    - _Requirements: 8.3_
    - _Validates: Property 3_

  - [ ] 13.3 * (Opcional) Property 4 — Dropdown roundtrip com `trapFocus={true}`
    - Para Dropdown aberto com `n ≥ 2` items, n Tabs retornam ao primeiro item
    - Consequência da Property 1 aplicada via integração focus trap
    - _Requirements: 8.3_
    - _Validates: Property 4_

- [ ] 14. Smoke checks finais
  - [ ] 14.1 Rodar `npm run lint`
    - Esperado: zero erros após Wave restante (10) terminada e regra ESLint instalada (11)
    - Anexar log em `tokens.md > Smoke checks finais`
    - _Requirements: 6.3, 7.2_

  - [ ] 14.2 Rodar `npx tsc --noEmit`
    - Esperado: zero erros
    - Anexar log
    - _Requirements: 7.2_

  - [ ] 14.3 Rodar `npm run test`
    - Esperado: zero falhas; todos os novos testes (Dropdown, focus trap, Modal smoke) e PBTs passam
    - Anexar log
    - _Requirements: 8.4_

  - [ ] 14.4 Rodar `npm run build`
    - Esperado: sucesso, 71 rotas compiladas (estado herdado das Fases 1/2; pode variar se rotas foram adicionadas)
    - Anexar log
    - _Requirements: 7.2_

- [ ] 15. Saída desta fase
  - [ ] 15.1 Validar saída
    - Todos os 8 Requirements de `requirements.md` têm evidência (path:linha de código, log de teste, ou link de PR) anexada
    - `tokens.md` cobre: Tokens semânticos, Variantes de opacidade (com `path:linha` por variante adotada), Escala tipográfica, Exceções declaradas, API conventions, Migration log, Lint anti-regressão, Contrato com CI Fase 7, Smoke checks finais
    - Contagem de `Hex_Literal` e `Font_Size_Arbitrary` em arquivos do escopo é **zero** OU exceções estão declaradas em `tokens.md`
    - Primitivos `Dropdown` e focus trap entregues, com testes determinísticos e PBTs passando
    - 5 Switches inline substituídos pelo primitivo `Switch`
    - 6 modais inline tratados (substituídos, abstraídos ou registrados como `OutOfScopeFinding`)
    - 6 sites de upload migrados para `useFileUpload`
    - Lint anti-regressão executável via `npm run lint`
    - Seção `OutOfScopeFinding` em `requirements.md` está vazia ou cada linha aponta commit no master spec
    - _Requirements: 7.2_

  - [ ] 15.2 [orquestrador] Atualizar Phase Card no master `requirements.md`
    - **Esta tarefa é executada pelo orquestrador, não pelo executor da fase**
    - `state: InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601 no formato `YYYY-MM-DDTHH:MM:SSZ`
    - Manter `child_spec_path` apontando para esta pasta
    - Re-rodar Spawn-Readiness Gate em `fase-5-ux` e `fase-6-mobile-cross-browser` (dependentes diretas)
    - _Requirements: 7.2_

## Notes

- Tarefas com `*` (13.1, 13.2, 13.3) entregam testes baseados em propriedade conforme as Properties declaradas em `design.md > Correctness Properties`. Tarefas sem `*` entregam testes determinísticos, código de produto ou documentação.
- A Wave 1 e Wave 2 são as ondas de maior densidade — terminar primeiro elas reduz o número de hex/font-size remanescentes em ≈80% e libera as waves posteriores para serem rápidas.
- A regra ESLint anti-regressão pode falhar em arquivos não-migrados durante as ondas — isso é esperado. A validação final (Tarefa 11.3) só faz sentido depois da Wave restante (10) terminada.
- Tarefas que tocam o mesmo arquivo (ex.: `globals.css` em 2.1, 2.2, 2.3; `eslint.config.mjs` em 11.1, 11.2; `src/components/ui/modal.tsx` em 4.3 e 8.x quando consumidores migrados) ficam em ondas distintas no grafo abaixo para evitar conflito de edição.
- Toda alteração que extrapole o escopo desta fase **NÃO** é absorvida — vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master.
- A migração de paleta para OKLCH (Tailwind v4 default) é candidata futura, registrada em `tokens.md > Migration log`, NÃO é tarefa desta fase.
- A documentação ampla de cada componente (Storybook, exemplos navegáveis) é Non-Goal desta fase — `tokens.md` cobre apenas tokens e variantes de opacidade.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "2.5"] },
    { "id": 3, "tasks": ["3.1", "4.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4"] },
    { "id": 6, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"] },
    { "id": 8, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2"] },
    { "id": 14, "tasks": ["11.1", "11.2"] },
    { "id": 15, "tasks": ["11.3", "11.4"] },
    { "id": 16, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 17, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 18, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 19, "tasks": ["15.1"] },
    { "id": 20, "tasks": ["15.2"] }
  ]
}
```

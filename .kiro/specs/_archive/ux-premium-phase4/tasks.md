# Implementation Plan: UX Premium Phase 4

## Overview

Implementação da camada de experiência premium (macOS-like) para a plataforma Privello. A abordagem é CSS-first para animações, componentes composáveis no design system, hooks customizados para loading/optimistic UI, e View Transitions API nativa do Next.js. A implementação segue uma ordem incremental: fundação CSS → componentes base → hooks → integração nas páginas.

## Tasks

- [ ] 1. Fundação CSS e Configuração
  - [ ] 1.1 Adicionar animation tokens e keyframes ao globals.css
    - Adicionar CSS custom properties de duração e easing (--duration-fast, --duration-normal, --duration-slow, --ease-spring, --ease-out, --ease-in)
    - Adicionar variáveis de skeleton (--skeleton-shimmer-duration, --skeleton-bg, --skeleton-highlight)
    - Criar keyframes: shimmer, fade-in, fade-out, slide-up, slide-down, scale-press, shake, pulse, stagger-in, confetti
    - Criar classes utilitárias de animação (animate-shimmer, animate-fade-in, animate-slide-up, animate-scale-press, animate-shake, animate-pulse)
    - Adicionar media query `prefers-reduced-motion: reduce` que desabilita todas as animações (duration: 0ms, animation: none)
    - _Requirements: 3.7, 12.6, 13.4_

  - [ ] 1.2 Habilitar View Transitions no next.config.ts
    - Adicionar `viewTransition: true` no bloco `experimental` do next.config.ts
    - _Requirements: 2.1, 2.2, 2.6_

- [ ] 2. Componentes Base do Design System
  - [ ] 2.1 Criar componente Skeleton base
    - Implementar `src/components/ui/skeleton.tsx` com props: variant, width, height, lines, showFallbackText, showErrorAfterTimeout, onRetry
    - Implementar shimmer animation via classe CSS
    - Adicionar timer de 4s para exibir texto "Carregando..." (font-size 12px, opacity 0.6)
    - Adicionar timer de 15s para exibir error state com botão retry
    - Adicionar atributos `aria-busy="true"` e `aria-label` para acessibilidade
    - _Requirements: 1.1, 1.3, 1.7, 1.8, 1.9_

  - [ ] 2.2 Criar skeleton variants compostos
    - Implementar `src/components/ui/skeleton-variants.tsx` com componentes: SkeletonCardGrid, SkeletonProfile, SkeletonDashboard, SkeletonTable, SkeletonGallery, SkeletonForm
    - Cada variante deve replicar a estrutura visual do conteúdo real (mesmas dimensões, colunas, linhas)
    - _Requirements: 1.1, 1.2_

  - [ ] 2.3 Criar componente EmptyState
    - Implementar `src/components/ui/empty-state.tsx` com props: variant, title, subtitle, ctaLabel, ctaHref, onCtaClick, suggestions, icon
    - Implementar variantes: favoritos, solicitacoes, midias, avaliacoes, busca, transacoes, suporte, generic
    - Cada variante com SVG illustration (max 120x120px, muted foreground 20% opacity), título (max 60 chars), subtítulo (max 120 chars), CTA button
    - Variante "busca" com até 3 sugestões clicáveis
    - Animação de entrada: fade-in + translateY(6px→0) em 300ms
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 2.4 Write property test for EmptyState variant completeness
    - **Property 5: EmptyState variant completeness**
    - **Validates: Requirements 5.1**

  - [ ] 2.5 Criar componente BottomSheet (mobile)
    - Implementar `src/components/ui/bottom-sheet.tsx` com props: open, onClose, children, maxHeight, showHandle, title
    - Implementar drag handle visível
    - Implementar drag-to-dismiss quando arraste > 40% da altura do sheet
    - Cancelar dismiss se soltar antes de 40%
    - Animação de entrada/saída com slide-up/slide-down
    - _Requirements: 10.2_

  - [ ] 2.6 Criar componente ProgressBar
    - Implementar `src/components/ui/progress-bar.tsx` com props: value, showPercentage, variant, size, indeterminate
    - Animação de preenchimento com ease transition
    - Suporte a modo indeterminate com shimmer
    - _Requirements: 4.5, 7.1, 7.2_

  - [ ] 2.7 Criar componente Breadcrumb
    - Implementar `src/components/ui/breadcrumb.tsx` com props: items, maxItems
    - Truncar segmentos intermediários com ellipsis quando exceder maxItems (default 5)
    - Segmentos clicáveis com navegação
    - _Requirements: 6.2_

- [ ] 3. Checkpoint - Componentes base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Hooks de UX
  - [ ] 4.1 Criar hook useAsyncAction
    - Implementar `src/lib/hooks/use-async-action.ts`
    - Gerenciar estados: isLoading, isTimeout, error, result, statusMessage
    - Desabilitar trigger e inputs do form durante execução (prevenir duplicatas)
    - Exibir statusMessage após 3s de loading
    - Timeout após 15s com cancel do request e opções retry/cancel
    - Re-habilitar elementos e preservar dados do form em caso de erro
    - Exibir confirmação de sucesso em até 200ms após resposta
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 4.2 Write property test for async action duplicate submission prevention
    - **Property 9: Async action duplicate submission prevention**
    - **Validates: Requirements 8.3**

  - [ ]* 4.3 Write property test for error recovery preserves form state
    - **Property 10: Error recovery preserves form state**
    - **Validates: Requirements 8.6**

  - [ ] 4.4 Criar hook useOptimisticToggle
    - Implementar `src/lib/hooks/use-optimistic-toggle.ts`
    - Aplicar update otimista em <100ms
    - Rollback automático se server falhar ou timeout >5000ms
    - Exibir notificação non-blocking em caso de rollback
    - _Requirements: 14.1_

  - [ ]* 4.5 Write property test for optimistic toggle with rollback
    - **Property 12: Optimistic toggle with rollback**
    - **Validates: Requirements 14.1**

  - [ ] 4.6 Criar hook useLazyLoad
    - Implementar `src/lib/hooks/use-lazy-load.ts`
    - Usar IntersectionObserver para defer loading de conteúdo abaixo do viewport
    - Threshold 0% intersection para trigger
    - _Requirements: 14.5_

  - [ ] 4.7 Criar hook usePrefetch
    - Implementar `src/lib/hooks/use-prefetch.ts`
    - Prefetch em hover (150ms delay) no desktop
    - Prefetch quando link entra em 50% do viewport no mobile
    - _Requirements: 14.3_

- [ ] 5. Sistema de Toast Aprimorado
  - [ ] 5.1 Aprimorar sistema de Toast existente
    - Estender toast com animação slide-in e checkmark animation (scale 0→1 com 20% overshoot) em 400ms
    - Success: auto-dismiss após 4s
    - Error: persistente até dismiss manual, com shake animation no container
    - Inline "Salvo" indicator com fade-in 200ms e auto-dismiss 2s
    - Stack vertical com 8px spacing, máximo 3 visíveis, queue para excedentes
    - ARIA live region: `aria-live="polite"` para success/info, `aria-live="assertive"` para error
    - _Requirements: 4.1, 4.2, 4.3, 4.8, 4.9_

  - [ ]* 5.2 Write property test for toast ARIA live region
    - **Property 3: Toast ARIA live region announces messages**
    - **Validates: Requirements 4.8**

  - [ ]* 5.3 Write property test for toast stack maximum visibility
    - **Property 4: Toast stack maximum visibility**
    - **Validates: Requirements 4.9**

- [ ] 6. Checkpoint - Hooks e Toast
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Microinterações e Animações
  - [ ] 7.1 Implementar microinterações de botões e elementos interativos
    - Button press: scale(0.97) com 100ms spring, retorno em 100ms
    - Card hover: shadow-sm→shadow-md + translateY(-1px) em 200ms
    - Nav link hover: background highlight 4% opacity em 150ms
    - Toggle switch: thumb 200ms spring + track color pulse 300ms
    - Form field focus: border color transition + focus ring 150ms
    - Destructive action: confirmation prompt + shake 2px/150ms
    - Suprimir todas interações em elementos disabled
    - Respeitar prefers-reduced-motion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 7.2 Write property test for reduced motion disables animations
    - **Property 1: Reduced motion disables all animations**
    - **Validates: Requirements 3.7, 12.6**

  - [ ]* 7.3 Write property test for disabled elements suppress interactions
    - **Property 2: Disabled elements suppress all microinteractions**
    - **Validates: Requirements 3.8**

  - [ ] 7.4 Implementar animações de entrada e saída de listas
    - List stagger: fade-in + translateY(8px) com 50ms delay entre items, max 20 items com stagger
    - Item removal: fade-out + scale(0.95) em 200ms + collapse height 200ms
    - Dropdown/popover open: scale(0.95→1) + opacity(0→1) em 150ms
    - Dropdown/popover close: scale(1→0.95) + opacity(1→0) em 100ms
    - Badge count change: scale pulse (1→1.2→1) em 200ms
    - Cancelar animação em progresso se novo trigger ocorrer
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.7_

  - [ ]* 7.5 Write property test for list stagger animation delay calculation
    - **Property 11: List stagger animation delay calculation**
    - **Validates: Requirements 12.1**

- [ ] 8. Transições de Página e Navegação
  - [ ] 8.1 Implementar page transitions com View Transitions API
    - Forward: fade + translateY(8px→0) em 250ms com cubic-bezier(0.16, 1, 0.3, 1)
    - Back: fade + translateY(-8px→0) em 250ms com mesma easing
    - Restaurar scroll position ao navegar back
    - Manter página anterior visível até novo conteúdo renderizar
    - Timeout de 3s: completar transição mostrando loading state
    - Aplicar a todas as route changes dentro do app shell
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 8.2 Implementar navegação e discoverability
    - Active nav item: background 6% foreground opacity + bold text
    - Breadcrumb para profundidade > 2 níveis (usar componente Breadcrumb)
    - Back arrow + parent section name para detail pages
    - New feature tooltip/highlight pulse (5s, uma vez por user por feature)
    - Desktop: action buttons no viewport inicial sem scroll
    - Mobile: fixed bottom navigation bar com 4 ícones + labels + active indicator 200ms
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 9. Skeleton Loaders por Rota
  - [ ] 9.1 Criar loading.tsx com skeletons contextuais para rotas principais
    - Criar `loading.tsx` para: discover/search (SkeletonCardGrid), perfil (SkeletonProfile), dashboard (SkeletonDashboard), tabelas admin (SkeletonTable), galeria (SkeletonGallery), formulários (SkeletonForm)
    - Substituir todos os spinners genéricos existentes por skeleton loaders contextuais
    - Transição skeleton→conteúdo: fade-in 200ms
    - Skip skeleton se conteúdo carregar em <200ms
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

- [ ] 10. Checkpoint - Animações e Transições
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. UX Mobile
  - [ ] 11.1 Implementar otimizações mobile
    - Touch targets: mínimo 44x44px com 8px spacing entre targets adjacentes
    - Modais como bottom sheet (usar componente BottomSheet)
    - Pull-to-refresh em list pages: 60px pull distance, loading indicator com cor primária
    - Header hide/show: hide com slide-up 200ms ao scroll down >50px, show ao scroll up >30px
    - Form inputs: tipos HTML corretos (tel, email, number), auto-focus primeiro campo, scroll into view com 16px clearance
    - Gallery swipe: horizontal com momentum scrolling, snap points centralizados, position indicator (dots ou "2/5")
    - Rubber-band effect nas bordas da gallery
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12. UX Desktop
  - [ ] 12.1 Implementar otimizações desktop
    - Hover states para todos elementos interativos (cards, buttons, links, table rows, nav items) com transição 150ms
    - Profile card hover: reveal quick-action buttons (favorite, view) com fade-in 200ms
    - Keyboard shortcuts: Ctrl+S (save), Escape (close modal), arrow keys (navigation)
    - preventDefault em shortcuts que conflitam com browser
    - Data tables: sortable headers com directional indicators, row reorder animation 300ms
    - Multi-column layouts: sidebar + content, min 320px content column
    - Layout adaptation com CSS transitions ≤300ms, CLS ≤0.1
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 13. Hierarquia Visual e Coerência
  - [ ] 13.1 Implementar padrões de hierarquia visual
    - Limitar a 3 níveis de hierarquia por seção (title, subtitle, body)
    - Progressive disclosure: collapsed por default com expand trigger (chevron/"Ver mais"), reveal inline 300ms
    - Agrupar ações secundárias em "Mais opções" dropdown quando >5 buttons (manter 2 primary visíveis)
    - Spacing rhythm: 8px related items, 16px groups, 32px sections
    - Emphasis colors: coral=CTAs, blue=links, green=success, gray 60%=secondary text
    - Numerical data: primary values 2xl-3xl semibold, labels sm normal 60% opacity
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 13.2 Implementar coerência visual entre páginas
    - Page layout: title (text-2xl semibold) + subtitle (text-muted) + content com padding responsivo (16px mobile, 24px tablet, 32px desktop)
    - Action buttons: max 2 primary top-right desktop, fixed bottom bar mobile (min 64px height)
    - Card patterns: radius-xl/16px, shadow-sm→shadow-md hover, padding 20px
    - Form patterns: labels text-sm font-medium acima, input 40px height, 6px label-input gap, 16px field groups, errors text-sm red, submit right-aligned desktop / full-width mobile
    - Table styling: muted header bg, row hover 4% opacity, cell padding 12px/10px, 1px border
    - Icon sizing: 16px inline, 20px buttons, 24px navigation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 14. Velocidade Percebida e Otimismo
  - [ ] 14.1 Implementar optimistic UI e perceived performance
    - Integrar useOptimisticToggle em toggles (favorite, online status, switches)
    - Form submit: button disabled + spinner em <50ms antes do network request
    - Integrar usePrefetch em navigation links
    - Image blur placeholder: blurred 20px intrinsic width, transição 300ms para full image
    - Lazy loading via useLazyLoad para conteúdo below-the-fold
    - Cache de páginas visitadas: exibir cached em <100ms + revalidar em background; se cache >30min, mostrar loading indicator
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 14.2 Write property test for image blur placeholder
    - **Property 13: Image blur placeholder presence**
    - **Validates: Requirements 14.4**

- [ ] 15. Onboarding Flow Premium
  - [ ] 15.1 Implementar UX premium no onboarding flow
    - Progress indicator: step atual (1-4), total (4), porcentagem (0%, 25%, 50%, 75%, 100%)
    - Progress bar advancement: 400ms ease + success micro-animation ≤600ms
    - Horizontal slide transition entre steps: left-to-right forward, right-to-left backward, 300ms
    - Contextual help text (max 120 chars) e input examples como placeholder/helper
    - Confirmation modal ao sair com dados não salvos
    - Celebration animation ao completar (confetti/checkmark burst ≤1500ms) + next-steps summary
    - Navegação livre entre steps visitados via sidebar sem perder dados
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 15.2 Write property test for onboarding progress calculation
    - **Property 7: Onboarding progress calculation**
    - **Validates: Requirements 7.1**

  - [ ]* 15.3 Write property test for onboarding data persistence
    - **Property 8: Onboarding data persistence across step navigation**
    - **Validates: Requirements 7.7**

- [ ] 16. Feedback Visual de Ações (Integração)
  - [ ] 16.1 Integrar feedback visual nas ações existentes
    - Form success: toast com checkmark animation
    - Form error: toast persistente + shake no form container
    - Save action: inline "Salvo" indicator
    - Favorite: heart icon scale pulse (1→1.3→1) + color fill 300ms
    - File upload: progress bar com percentage text (atualizar a cada 500ms min)
    - Upload complete: progress 100% → success checkmark 200ms
    - Network failure: error state + retry button + shake
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 16.2 Write property test for error state prevents EmptyState
    - **Property 6: Error state prevents EmptyState display**
    - **Validates: Requirements 5.6**

- [ ] 17. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All animations respect `prefers-reduced-motion` media query
- View Transitions API degrades gracefully in unsupported browsers
- CSS-first approach minimizes runtime JS for animations

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.5", "2.6", "2.7"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "4.4", "4.6", "4.7"] },
    { "id": 3, "tasks": ["2.4", "4.2", "4.3", "4.5", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "7.1", "7.4"] },
    { "id": 5, "tasks": ["7.2", "7.3", "7.5", "8.1", "8.2"] },
    { "id": 6, "tasks": ["9.1", "11.1", "12.1"] },
    { "id": 7, "tasks": ["13.1", "13.2", "14.1"] },
    { "id": 8, "tasks": ["14.2", "15.1", "16.1"] },
    { "id": 9, "tasks": ["15.2", "15.3", "16.2"] }
  ]
}
```

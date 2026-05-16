# Implementation Plan: Design System

## Overview

Implementação do Design System da Privello seguindo a arquitetura tokens → componentes → padrões. O plano cobre: completar tokens de design (cores warning/danger/blue, opacity variants), criar componentes novos (Dropdown, useFocusTrap), refatorar componentes existentes para conformidade com tokens, e adicionar documentação. A implementação usa TypeScript com React, Tailwind v4, e testes com Vitest + fast-check.

## Tasks

- [ ] 1. Design Tokens — Completar e padronizar tokens em globals.css
  - [ ] 1.1 Adicionar tokens de cor faltantes e opacity variants
    - Adicionar CSS custom properties para `--privello-warning` (#ff9f0a), `--privello-danger` (#ff3b30), `--privello-blue` (#0a84ff) em `:root`
    - Adicionar opacity variants (4%, 6%, 10%, 12%, 20%) para cada cor semântica (coral, success, warning, danger, blue)
    - Expor todos os novos tokens via `@theme inline` no Tailwind v4 para gerar classes como `bg-warning`, `text-danger`, `bg-coral/10`
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 1.2 Padronizar tokens de tipografia, espaçamento, sombras, radius e transições
    - Verificar e completar a escala tipográfica (xs→4xl) como custom properties
    - Verificar tokens de espaçamento (card-padding, section-gap, form-gap, page-padding responsive)
    - Verificar escala de sombras (xs, sm, md, lg) com valores exatos do design
    - Verificar escala de border-radius (sm→full) com valores exatos
    - Adicionar tokens de transição (fast, normal, slow, easing) e keyframes (fade-in, scale-in, slide-in)
    - _Requirements: 2.1, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 6.1, 6.2, 6.3_

- [ ] 2. Utility hooks e funções auxiliares
  - [ ] 2.1 Criar hook useFocusTrap
    - Criar `src/lib/hooks/use-focus-trap.ts`
    - Implementar trap de foco que cicla Tab/Shift+Tab dentro de um container ref
    - Retornar foco ao elemento anterior quando o trap é desativado
    - _Requirements: 10.5, 10.6, 15.6_

  - [ ] 2.2 Verificar e atualizar cn() utility e hooks existentes
    - Verificar `src/lib/utils.ts` — garantir que `cn()` usa `clsx` + `tailwind-merge`
    - Verificar `use-scroll-lock.ts` e `use-escape-key.ts` existem e funcionam
    - _Requirements: 18.1, 18.2_

- [ ] 3. Componente Button — Refatorar para conformidade com design system
  - [ ] 3.1 Atualizar Button com todas as variantes e tamanhos
    - Garantir variantes: primary (blue), coral, secondary, ghost, danger com classes de token
    - Garantir tamanhos: sm, md, lg com padding e font-size corretos
    - Implementar estado loading com spinner e disabled com opacity 40%
    - Garantir `font-medium`, border-radius do token scale, e active `scale(0.98)` com transição fast
    - Suportar `ref` prop via React.forwardRef
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 6.4_

  - [ ]* 3.2 Escrever testes unitários para Button
    - Testar cada variante renderiza classes corretas
    - Testar loading state renderiza spinner e desabilita
    - Testar disabled state aplica opacity e desabilita
    - Testar ref forwarding
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [ ] 4. Componentes de Formulário — Input, Textarea, Select
  - [ ] 4.1 Refatorar Input para conformidade com design system
    - Aplicar styling base: border-black/10, shadow-xs inset, rounded-lg, text-[14px]
    - Implementar focus state: border-blue + focus ring 3px 25% opacity
    - Implementar error state: red border, red focus ring, error message, aria-invalid, aria-describedby
    - Implementar disabled state: bg-black/[0.03] + muted text
    - Suportar props: label, hint, error, prefix
    - Associar label com input via htmlFor/id
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 15.1, 15.4, 15.5_

  - [ ] 4.2 Refatorar Textarea para conformidade com design system
    - Aplicar mesmo contrato visual do Input (border, shadow, radius, text size)
    - Implementar focus, error, disabled states idênticos ao Input
    - Suportar props: label, hint, error
    - Associar label com textarea via htmlFor/id
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 15.4, 15.5_

  - [ ] 4.3 Refatorar Select para conformidade com design system
    - Aplicar mesmo contrato visual do Input (border, shadow, radius, text size)
    - Implementar focus, error, disabled states idênticos ao Input
    - Suportar props: label, hint, error, options, placeholder
    - Associar label com select via htmlFor/id
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 15.4, 15.5_

  - [ ]* 4.4 Escrever property tests para componentes de formulário
    - **Property 1: Form component base styling consistency**
    - **Property 2: Form component focus ring pattern**
    - **Property 3: Form component error state completeness**
    - **Property 4: Form component optional props rendering**
    - **Property 5: Form component disabled styling**
    - **Property 6: Form component label-input association**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 15.1, 15.4, 15.5**

- [ ] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Componente Card — Refatorar para conformidade
  - [ ] 6.1 Atualizar Card com variantes, padding e sub-componentes
    - Implementar variantes: default (glass-card), solid (white + border), dark (sidebar color)
    - Implementar padding options: none, sm (16px), md (20px), lg (24px)
    - Garantir CardHeader, CardTitle, CardDescription sub-componentes
    - Aplicar shadow-sm em repouso, transição para shadow-md no hover (200ms ease)
    - Usar border-radius xl (16px) do token scale
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 4.6, 5.1_

  - [ ]* 6.2 Escrever testes unitários para Card
    - Testar cada combinação variante/padding renderiza classes corretas
    - Testar sub-componentes renderizam corretamente
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 7. Componente Modal — Refatorar com focus trap e acessibilidade
  - [ ] 7.1 Atualizar Modal com focus trap, posições e acessibilidade completa
    - Integrar hook `useFocusTrap` quando modal está aberto
    - Integrar `useScrollLock` e `useEscapeKey`
    - Implementar position variants: center, bottom (mobile sheet), fullscreen
    - Garantir backdrop blur com fade-in animation
    - Garantir content com scale-in animation (slow duration)
    - Implementar `persistent` prop que previne fechar no backdrop click
    - Garantir `role="dialog"`, `aria-modal="true"`
    - Retornar foco ao trigger element no close
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 6.5, 15.6_

  - [ ]* 7.2 Escrever testes unitários e de integração para Modal
    - Testar Escape key chama onClose
    - Testar backdrop click chama onClose (e não quando persistent)
    - Testar ARIA attributes presentes
    - Testar focus trap cicla Tab dentro do modal
    - Testar position variants aplicam classes corretas
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 8. Componente Dropdown — Implementar novo componente
  - [ ] 8.1 Criar componente Dropdown com compound pattern
    - Criar `src/components/ui/dropdown.tsx`
    - Implementar compound components: Dropdown, DropdownTrigger, DropdownContent, DropdownItem
    - Posicionar content abaixo do trigger com shadow-lg e rounded-xl
    - Implementar close on outside click e Escape key
    - Implementar keyboard navigation com arrow keys entre items
    - Implementar item variants: default, danger (red text), disabled (muted + no pointer events)
    - Suportar `align` prop: start, center, end
    - Gerenciar focus no open/close
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 15.6_

  - [ ]* 8.2 Escrever testes unitários e de integração para Dropdown
    - Testar outside click fecha dropdown
    - Testar Escape fecha dropdown
    - Testar arrow key navigation
    - Testar item variants renderizam corretamente
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 9. Componente Badge — Refatorar com variantes semânticas
  - [ ] 9.1 Atualizar Badge com todas as variantes e opacity pattern
    - Implementar variantes: default, coral, success, warning, muted, dark
    - Aplicar rounded-full, text-xs (11px), font-semibold, px-2 (8px)
    - Para variantes semânticas (coral, success, warning): background com 10-12% opacity + text color full strength
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 9.2 Escrever property test para Badge
    - **Property 7: Badge semantic variant opacity pattern**
    - **Validates: Requirements 11.3**

- [ ] 10. Componente Avatar — Refatorar com initials e ring
  - [ ] 10.1 Atualizar Avatar com sizes, initials fallback e ring
    - Implementar sizes: xs (28px), sm (36px), md (48px), lg (64px), xl (96px)
    - Implementar initials fallback: extrair primeira letra do primeiro e último nome
    - Implementar ring indicator com color variants: coral, success, foreground, muted
    - Garantir rounded-full e overflow-hidden
    - Fallback para "?" quando sem src e sem fallback/alt
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 10.2 Escrever property test para Avatar initials
    - **Property 8: Avatar initials derivation**
    - **Validates: Requirements 13.2**

- [ ] 11. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Componente Toast — Refatorar sistema de notificações
  - [ ] 12.1 Atualizar Toast system com context provider e animações
    - Garantir ToastProvider com context pattern
    - Implementar variantes: success (green border + CheckCircle icon), error (red border + XCircle icon)
    - Posicionar bottom-right com slide-in animation
    - Implementar auto-dismiss em 3500ms
    - Implementar dismiss button para fechamento manual
    - Aplicar shadow-lg, rounded-xl, colored left border
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 12.2 Escrever testes unitários para Toast
    - Testar auto-dismiss timing com mock timers
    - Testar dismiss button funciona
    - Testar variantes renderizam ícones corretos
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 13. Componentes Switch e ToggleChip — Refatorar
  - [ ] 13.1 Atualizar Switch com sizes, label e acessibilidade
    - Implementar sizes: sm, md
    - Suportar props: checked, onChange, disabled, label
    - Garantir `aria-checked` attribute
    - Garantir keyboard toggle com Space/Enter
    - _Requirements: 18.1, 15.6_

  - [ ] 13.2 Atualizar ToggleChip para conformidade
    - Garantir props: active, onClick, children
    - Aplicar styling distinto do Switch (chip/pill visual)
    - _Requirements: 18.5_

- [ ] 14. Acessibilidade e contraste — Validação cross-component
  - [ ] 14.1 Implementar e validar padrões de acessibilidade
    - Garantir focus ring pattern (blue, 3px, 25% opacity) em todos os elementos interativos
    - Garantir aria-label em icon-only buttons
    - Verificar contraste WCAG AA (4.5:1 normal text, 3:1 large text) para todos os pares de cor definidos
    - Garantir keyboard navigation funciona em Button, Modal, Dropdown, Switch
    - _Requirements: 15.1, 15.2, 15.3, 15.6_

  - [ ]* 14.2 Escrever property test para contraste de cores
    - **Property 9: Color contrast WCAG AA compliance**
    - **Validates: Requirements 15.3**

- [ ] 15. Documentação do Design System
  - [ ] 15.1 Criar arquivo de documentação do design system
    - Criar `src/docs/design-system.md`
    - Documentar todos os design tokens com valores e guidelines de uso
    - Documentar cada componente: props interface, variantes, sizes, exemplos de uso, notas de acessibilidade
    - Incluir guia de migração: como substituir valores hardcoded por tokens
    - Documentar princípios macOS_Aesthetic: font-semibold, sombras sutis, transições suaves, hierarquia de cantos
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 16. Eliminação de duplicações — Consolidar implementações
  - [ ] 16.1 Identificar e substituir implementações duplicadas
    - Buscar toggle/switch duplicados no codebase e substituir pelo componente Switch único
    - Buscar modal/overlay duplicados e substituir pelo componente Modal único
    - Buscar menu/dropdown inline e substituir pelo componente Dropdown único
    - Documentar componentes canônicos para cada padrão
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 17. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Vitest as test framework and fast-check for property-based tests
- All components are in `src/components/ui/` and consume tokens exclusively via Tailwind semantic classes
- The `cn()` utility (clsx + tailwind-merge) is used for all class composition

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2", "4.3", "6.1", "9.1", "10.1", "13.1", "13.2"] },
    { "id": 3, "tasks": ["3.2", "4.4", "6.2", "9.2", "10.2"] },
    { "id": 4, "tasks": ["7.1", "8.1", "12.1"] },
    { "id": 5, "tasks": ["7.2", "8.2", "12.2"] },
    { "id": 6, "tasks": ["14.1", "15.1", "16.1"] },
    { "id": 7, "tasks": ["14.2"] }
  ]
}
```
